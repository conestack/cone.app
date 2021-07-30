/* toggle vertical arrow icon */

export function toggle_arrow(arrow) {
    if (arrow.hasClass('bi-chevron-up')) {
        arrow.removeClass('bi-chevron-up');
        arrow.addClass('bi-chevron-down');
    } else {
        arrow.removeClass('bi-chevron-down');
        arrow.addClass('bi-chevron-up');
    }
};
