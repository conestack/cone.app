Copysupport::

    >>> from plumber import plumber
    >>> from node.utils import instance_property
    >>> from cone.app.model import (
    ...     BaseNode,
    ...     Properties,
    ... )
    >>> from cone.app.tests.mock import CopySupportNode
    
    >>> node = CopySupportNode()
    >>> node.properties.copysupport
    True