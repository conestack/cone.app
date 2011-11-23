from plumber import (
    Part,
    default,
)
from pyramid.security import has_permission


class CopySupport(Part):
    """Abstract copy support behavior.
    """
    
    @default
    def cut_possible(self, request):
        return has_permission('delete', request)
    
    @default
    def copy_possible(self, request):
        return has_permission('edit', request)
    
    @default
    def paste_possible(self, request):
        return has_permission('add', request)