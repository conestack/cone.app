Copysupport::

    >>> from plumber import plumber
    >>> from node.utils import instance_property
    >>> from cone.app.model import (
    ...     BaseNode,
    ...     Properties,
    ... )
    >>> from cone.app.tests.mock import CopySupportNode
    
    >>> node = CopySupportNode()
    >>> node.properties.action_cut
    True
    
    >>> node.properties.action_copy
    True
    
    >>> node.properties.action_paste
    True