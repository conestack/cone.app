from cone.tile import Tile
from cone.tile import render_template


BATCH_RANGE = 8


class Batch(Tile):
    """An abstract batch tile.

    A subclass has to implement 'self.vocab' and may override
    'self.batchrange', 'self.display' and 'self.batchname'.
    """
    dummypage = {
        'page': '',
        'current': False,
        'visible': False,
        'url': '',
    }

    ellipsis = u'...'

    def render(self):
        return render_template('cone.app.browser:templates/batch.pt',
                               request=self.request,
                               model=self.model, context=self)

    @property
    def vocab(self):
        return []

    @property
    def display(self):
        return True

    @property
    def batchrange(self):
        return BATCH_RANGE

    @property
    def currentpage(self):
        for page in self.vocab:
            if page['current']:
                return page
        return None

    @property
    def firstpage(self):
        firstpage = None
        for page in self.vocab:
            if page['visible']:
                firstpage = page
                break
        if not firstpage and self.vocab:
            firstpage = self.vocab[0]
        return firstpage

    @property
    def lastpage(self):
        lastpage = None
        count = len(self.vocab)
        while count > 0:
            count -= 1
            page = self.vocab[count]
            if page['visible']:
                lastpage = self.vocab[count]
                break
        if not lastpage and self.vocab:
            lastpage = self.vocab[len(self.vocab) - 1]
        return lastpage

    @property
    def prevpage(self):
        prevpage = None
        position = self._getPositionOfCurrentInVocab() - 1
        while position >= 0:
            page = self.vocab[position]
            if page['visible']:
                prevpage = self.vocab[position]
                break
            position -= 1
        if not prevpage and self.vocab:
            prevpage = self.dummypage
        return prevpage

    @property
    def nextpage(self):
        nextpage = self.dummypage
        position = self._getPositionOfCurrentInVocab() + 1
        if position == 0 and self.vocab:
            return nextpage
        if position == 0 and not self.vocab:
            return None
        while position < len(self.vocab):
            page = self.vocab[position]
            if page['visible']:
                nextpage = self.vocab[position]
                break
            position += 1
        return nextpage

    @property
    def leftellipsis(self):
        return self._leftOverDiff < 0 and self.ellipsis or u''

    @property
    def rightellipsis(self):
        return self._rightOverDiff < 0 and self.ellipsis or u''

    @property
    def pages(self):
        pos = self._getPositionOfCurrentInVocab()
        count = len(self.vocab)
        start = max(pos - self._siderange - max(self._rightOverDiff, 0), 0)
        end = min(pos + self._siderange + max(self._leftOverDiff, 0) + 1,
                  count)
        return self.vocab[start:end]

    @property
    def _siderange(self):
        return self.batchrange / 2

    @property
    def _leftOverDiff(self):
        currentPosition = self._getPositionOfCurrentInVocab()
        return self._siderange - currentPosition

    @property
    def _rightOverDiff(self):
        position = self._getPositionOfCurrentInVocab()
        count = len(self.vocab)
        return position + self._siderange - count + 1

    def _getPositionOfCurrentInVocab(self):
        #TODO: wildcard handling
        current = self.currentpage
        if current is None:
            return -1
        pointer = 0
        for page in self.vocab:
            if page['page'] == current['page']:
                return pointer
            pointer += 1
        # reached if subclass implementation bug
        return -1                                           #pragma NO COVERAGE
