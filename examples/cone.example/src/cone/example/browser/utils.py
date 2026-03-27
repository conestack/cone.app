from pygments import highlight
from pygments.lexers import get_lexer_by_name, TextLexer
from pygments.formatters import HtmlFormatter


_formatter = HtmlFormatter(nowrap=False, cssclass='highlight')


def code_block(code, lang="python"):
    """Highlight code using pygments.

    Returns HTML with .highlight wrapper for proper CSS styling.
    The output works with both light and dark pygments themes.
    """
    try:
        lexer = get_lexer_by_name(lang)
    except Exception:
        lexer = TextLexer()

    return highlight(code, lexer, _formatter)
