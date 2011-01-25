from datetime import datetime

class DatetimeHelper(object):
    
    def w_value(self, val):
        if isinstance(val, datetime):
            return self.dt_to_iso(val)
        if not isinstance(val, unicode):
            val = str(val).decode('utf-8')
        return val
    
    def r_value(self, val):
        try:
            return self.dt_from_iso(val)
        except ValueError:
            if not isinstance(val, unicode):
                val = str(val).decode('utf-8')
            return val
    
    def dt_from_iso(self, str):
        return datetime.strptime(str, '%Y-%m-%dT%H:%M:%S')
    
    def dt_to_iso(self, dt):
        iso = dt.isoformat()
        if iso.find('.') != -1:
            iso = iso[:iso.rfind('.')]
        return iso