/* 
 * cone.app main JS
 * 
 * Requires:
 *     bdajax
 *     jquery ui autocomplete
 */

if (typeof(window['yafowil']) == "undefined") yafowil = {};

(function($) {

    $(document).ready(function() {
        
        // personaltools
        $('#personaltools').dropdownmenu({
            menu: '.dropdown_items',
            trigger: '.currentuser a'
        });
        
        // initial binding
        cone.livesearchbinder();
        cone.tabsbinder();
        cone.dropdownmenubinder();
        cone.transitionmenubinder();
        cone.ajaxformbinder();
        yafowil.referencebrowser.browser_binder();
        
        // add binders to bdajax binding callbacks
        $.extend(bdajax.binders, {
            tabsbinder: cone.tabsbinder,
            dropdownmenubinder: cone.dropdownmenubinder,
            transitionmenubinder: cone.transitionmenubinder,
            ajaxformbinder: cone.ajaxformbinder,
            refbrowser_browser_binder: yafowil.referencebrowser.browser_binder,
            refbrowser_add_reference_binder: 
                yafowil.referencebrowser.add_reference_binder
        });
    });
    
    cone = {
        
        livesearchbinder: function(context) {
            $('input#search-text', context).autocomplete({
                source: 'livesearch',
                minLength: 3,
                select: function(event, ui) {
                    $('input#search-text').val('');
                    bdajax.action({
                        name: 'content',
                        selector: '#content',
                        mode: 'inner',
                        url: ui.item.target,
                        params: {}
                    });
                    bdajax.trigger('contextchanged',
                                   '.contextsensitiv',
                                   ui.item.target);
                    return false;
                }
            });
        },
        
        tabsbinder: function(context) {
            // XXX: make it possible to bind ajax tabs by indicating ajax via 
            //      css class.
            $("ul.tabs", context).tabs("div.tabpanes > div");
        },
        
        dropdownmenubinder: function(context) {
            $('.dropdown', context).dropdownmenu();
        },
        
        transitionmenubinder: function(context) {
            $('.transitions_dropdown', context).dropdownmenu({
                menu: '.dropdown_items',
                trigger: '.state a'
            });
        },
        
        // ajax form related. XXX: move to bdajax
        
        // bind ajax form handling to all forms providing ajax css class
        ajaxformbinder: function(context) {
            var ajaxform = $('form.ajax', context);
            ajaxform.append('<input type="hidden" name="ajax" value="1" />');
            ajaxform.attr('target', 'ajaxformresponse');
            ajaxform.unbind().bind('submit', function(event) {
                bdajax.spinner.show();
            });
        },
        
        // called by iframe response, renders form (i.e. if validation errors)
        ajaxformrender: function(payload, selector, mode) {
            if (!payload) {
                return;
            }
            bdajax.spinner.hide();
            bdajax.fiddle(payload, selector, mode);
        }
    }
    
    /* 
     * Dropdown menu
     * =============
     * 
     * Markup
     * ------
     * 
     *     <div class="dropdown">
     *       <div class="icon">
     *         <a href="http://example.com">&nbsp;</a>
     *       </div>
     *       <ul class="dropdown_items" style="display:none;">
     *         <li>
     *           <a href="http://example.com/whatever">
     *             Item title
     *           </a>
     *         </li>
     *       </ul>
     *     </div>
     * 
     * Script
     * ------
     * 
     *     $('.dropdown').dropdownmenu({
     *         menu: '.dropdown_items',
     *         trigger: '.icon a'
     *     });
     */
    $.fn.dropdownmenu = function (options) {
        var trigger = options ? (options.trigger ? options.trigger : '.icon a')
                              : '.icon a';
        var menu = options ? (options.menu ? options.menu : '.dropdown_items')
                           : '.dropdown_items';
        this.unbind('click');
        $(trigger, this).bind('click', function(event) {
            event.preventDefault();
            var container = $(menu, $(this).parent().parent());
            $(document).unbind('mousedown')
                       .bind('mousedown', function(event) {
                if ($(event.target).parents(menu + ':first').length) {
                    return true;
                }
                container.css('display', 'none');
            });
            container.css('display', 'block');
        });
        return this;
    }
    
    /*
     * Reference Browser
     * =================
     * 
     * Markup
     * ------
     * 
     *     <input type="text" name="foo" class="referencebrowser" />
     *     <input type="hidden" name="foo.uid" value="" />
     * 
     * for single value reference or
     * 
     *     <select name="foo" class="referencebrowser" />
     * 
     * for multi valued reference.
     * 
     * Script
     * ------
     * 
     *     $('input.referencebrowser').referencebrowser();
     */
    $.fn.referencebrowser = function() {
        var icon = $('<a>&nbsp;</a>').attr('class', 'reference16_16');
        this.after(icon);
        icon = this.next();
        icon.unbind('click');
        icon.bind('click', function() {
            var elem = $(this);
            yafowil.referencebrowser.target = elem.prev().get(0);
            yafowil.referencebrowser.overlay = bdajax.overlay({
                action: 'referencebrowser',
                target: elem.parent().attr('ajax:target')
            });
        });
    }
    
    // extend yafowil by reference browser widget.
    $.extend(yafowil, {
        
        referencebrowser: {
        
            overlay: null,
            
            target: null,
            
            browser_binder: function(context) {
                $('input.referencebrowser', context).referencebrowser();
                $('select.referencebrowser', context).referencebrowser();
            },
            
            add_reference_binder: function(context) {
                $('a.addreference').bind('click', function(event) {
                    event.preventDefault();
                    yafowil.referencebrowser.addreference(this);
                });
            },
            
            addreference: function(elem) {
                elem = $(elem);
                var uid = elem.attr('id');
                uid = uid.substring(4, uid.length);
                // XXX: UID missing - Check!
                if (!uid) {
                    return;
                }
                var label = $('.reftitle', elem.parent()).html();
                var target = yafowil.referencebrowser.target;
                var tag = target.tagName;
                target = $(target);
                // text input for single valued
                if (tag == 'INPUT') {
                    target.attr('value', label);
                    var sel = '[name=' + target.attr('name') + '.uid]';
                    $(sel).attr('value', uid);
                    yafowil.referencebrowser.overlay.close();
                    return;
                }
                // select input for multi valued
                if (tag == 'SELECT') {
                    if ($('[value=' + uid + ']', target.parent()).length) {
                        return;
                    }
                    var option = $('<option></option>')
                        .val(uid)
                        .html(label)
                        .attr('selected', 'selected')
                    ;
                    target.append(option);
                }
            }
        }
    });

})(jQuery);