import os
from twisted.web.server import Site
from twisted.web.wsgi import WSGIResource
from twisted.internet import reactor
from twisted.application import (
    internet,
    service,
)
from pyramid.paster import get_app


config='./cone.ini'
config = os.path.abspath(config)
port = 8081


# Get the WSGI application
myApp = get_app(config, 'main')

# Twisted WSGI server setup
resource = WSGIResource(reactor, reactor.getThreadPool(), myApp)
factory = Site(resource)

# Twisted Application setup
application = service.Application('cone')
internet.TCPServer(port, factory).setServiceParent(application)