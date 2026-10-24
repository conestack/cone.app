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
        this.content = $('#content');
        this.result = null;

        this._term = '';
        this._minlen = 3;
        this._delay = 250;
        this._timeout_event = null;
        this._in_progress = false;

        this.on_keydown = this.on_keydown.bind(this);
        this.on_change = this.on_change.bind(this);
        this.on_result = this.on_result.bind(this);

        elem.on('keydown', this.on_keydown);
        elem.on('change', this.on_change);
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

    render_no_results() {
        ts.compile_template(this, `
        <h5 class="card-title">No search results</h5>
        `, this.result);
    }

    render_suggestion(item) {
        ts.compile_template(this, `
        <div class="mb-4">
          <h5 class="card-title">
            <a href="${item.target}"
               ajax:bind="click"
               ajax:event="contextchanged:#layout"
               ajax:target="${item.target}">
              <i class="${item.icon}"></i>
              ${item.value}
            </a>
          </h5>
          <p class="card-text">
            ${item.description === undefined ? '' : item.description}
          </p>
        </div>
        `, this.result);
    }

    on_result(data, status, request) {
        this.content.empty();
        ts.compile_template(this, `
        <div class="card mt-2">
          <div class="card-body" t-elem="result">
            <h3 class="card-title mb-3">Search results for "${this._term}"</h3>
          </div>
        </div>
        `, this.content);
        if (!data.length) {
            this.render_no_results();
        } else {
            ts.compile_template(this, `
            <p class="card-text mb-3">
              <span>${data.length} Results</span>
            </p>
            `, this.result);
            for (const item of data) {
                this.render_suggestion(item);
            }
        }
        this.result.tsajax();
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
}
