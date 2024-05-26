import $ from 'jquery';
import ts from 'treibstoff';

export class LiveSearch {

    static initialize(context, factory=null) {
        const elem = ts.query_elem('input#search-text', context);
        if (!elem) {
            return;
        }
        if (factory === null) {
            factory = cone.LiveSearch;
        }
        new factory(elem);
    }

    constructor(elem) {
        this.elem = elem;
        this.target = `${elem.data('search-target')}/livesearch`;
        this.result = $('<ul />')
            .attr('id', 'livesearch-result')
            .attr('class', 'dropdown-menu')
            .insertAfter(elem.parents('.input-group'));

        this._term = '';
        this._minlen = 3;
        this._delay = 250;
        this._timeout_event = null;
        this._in_progress = false;

        this.on_keydown = this.on_keydown.bind(this);
        this.on_change = this.on_change.bind(this);
        this.on_result = this.on_result.bind(this);
        this.on_select = this.on_select.bind(this);

        elem.on('keydown', this.on_keydown);
        elem.on('change', this.on_change);

        // let source = new Bloodhound({
        //     datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
        //     queryTokenizer: Bloodhound.tokenizers.whitespace,
        //     remote: 'livesearch?term=%QUERY'
        // });
        // source.initialize();
        // this.render_suggestion = this.render_suggestion.bind(this);
        // elem.typeahead(null, {
        //     name: 'livesearch',
        //     displayKey: 'value',
        //     source: source.ttAdapter(),
        //     templates: {
        //         suggestion: this.render_suggestion,
        //         empty: '<div class="empty-message">No search results</div>'
        //     }
        // });
        // this.on_select = this.on_select.bind(this);
        // let event = 'typeahead:selected';
        // elem.off(event).on(event, this.on_select);
    }

    search() {
        this._in_progress = true;
        ts.http_request({
            url: this.target,
            params: {term: this._term},
            type: 'json',
            success: this.on_result
        });
        this._in_progress = false;
    }

    on_keydown(evt) {
        if (evt.keyCode === 13) {
            return;
        }
        ts.clock.schedule_frame(() => {
            if (this._term !== this.elem.val()) {
                this.elem.trigger('change');
            }
        });
    }

    on_change(evt) {
        if (this._in_progress) {
            return;
        }
        const term = this.elem.val();
        if (this._term === term) {
            return;
        }
        this._term = term;
        if (this._term.length < this._minlen) {
            return;
        }
        if (this._timeout_event !== null) {
            this._timeout_event.cancel();
        }
        this._timeout_event = ts.clock.schedule_timeout(() => {
            this._timeout_event = null;
            this.search();
        }, this._delay);
    }

    on_result(data, status, request) {
        console.log(data);
    }

    on_select(evt, suggestion, dataset) {
        if (!suggestion.target) {
            console.log('No suggestion target defined.');
            return;
        }
        ts.ajax.trigger(
            'contextchanged',
            '#layout',
            suggestion.target
        );
    }

    render_suggestion(suggestion) {
        return `<span class="${suggestion.icon}"></span>${suggestion.value}`;
    }
}
