from pygments import highlight
from pygments.lexers import get_lexer_by_name, TextLexer
from pygments.formatters import HtmlFormatter


_formatter = HtmlFormatter(nowrap=True)

def code_block(code, lang="python"):
    try:
        lexer = get_lexer_by_name(lang)
    except Exception:
        lexer = TextLexer()

    return highlight(code, lexer, _formatter)
