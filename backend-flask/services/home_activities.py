from datetime import datetime, timedelta, timezone
from lib.db import db

class HomeActivities:
  def run():
    sql = db.template('activities','home')
    results = db.query_array_json(sql)
    
    return results