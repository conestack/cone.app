from node.interfaces import IBoundContext
from odict import odict
import warnings


class ContextBoundContainer(odict):

    def add_object(self, key, obj, context=None):
        if IBoundContext.providedBy(obj):
            obj.bind_context(context)
        store = self.setdefault(key, list())
        store.insert(0, obj)

    def lookup_object(self, model, key, default=None):
        objects = odict.get(self, key)
        obj = None
        if objects:
            obj = self.best_match(model, objects)
        return obj if obj else default

    def filtered_objects(self, model):
        filtered = list()
        for objects in odict.values(self):
            obj = self.best_match(model, objects)
            if obj:
                filtered.append(obj)
        return filtered

    def best_match(self, model, objects):
        unbound = bound = None
        for obj in objects:
            if IBoundContext.providedBy(obj):
                # first matching bound obj takes precedence
                if obj.context_matches(model):
                    bound = obj
                    break
            elif unbound is None:
                # remember first found unbound obj
                unbound = obj
        return bound if bound else unbound

    def add_to(self, key, child_key, child, context=None):
        for obj in self._get_all(key):
            if isinstance(obj, ContextBoundContainer):
                obj.add_object(child_key, child, context)
            else:
                obj[child_key] = child

    # B/C code below. Will be removed in future versions.

    def __setitem__(self, key, value):
        warnings.warn(
            'Deprecated use of {}.__setitem__. Use ``add_object`` instead. '
            'This function will raise a ``RuntimeError`` in future '
            'versions'.format(self.__class__.__name__)
        )
        store = self.setdefault(key, list())
        store.insert(0, value)

    def __getitem__(self, key):
        warnings.warn(
            'Deprecated use of {}.__getitem__(). Use ``lookup_object`` '
            'instead. This function will raise a ``RuntimeError`` '
            'in future versions'.format(self.__class__.__name__)
        )
        # Returns the most recent added value. This equates to the original
        # behavior when elements were overwritten
        return self._get_all(key)[0]

    def get(self, key, default=None):
        warnings.warn(
            'Deprecated use of {}.get(). Use ``lookup_object`` '
            'instead. This function will raise a ``RuntimeError`` '
            'in future versions'.format(self.__class__.__name__)
        )
        # Returns the most recent added value if found. This equates to the
        # original behavior when elements were overwritten
        objects = odict.get(self, key)
        return objects[0] if objects else default

    def values(self):
        warnings.warn(
            'Deprecated use of {}.values(). Use ``filtered_objects`` '
            'instead. This function will raise a ``RuntimeError`` '
            'in future versions'.format(self.__class__.__name__)
        )
        # Returns the most recent added values. This equates to the original
        # behavior when elements were overwritten
        return [val[0] for val in odict.values(self)]

    def setdefault(self, key, default=None):
        if key in self:
            return self._get_all(key)
        odict.__setitem__(self, key, default)
        return default

    def _get_all(self, key):
        return self._dict_impl().__getitem__(self, key)[1]
