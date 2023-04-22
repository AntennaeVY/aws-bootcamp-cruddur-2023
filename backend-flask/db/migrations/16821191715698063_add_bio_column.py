class AddBioColumnMigration(Migration):
  def migrate_sql():
    data = """
    """
    return data
  def rollback_sql():
    data = """
    """
    return data
  def migrate():
    this.query_commit(this.migrate_sql(),{
    })
  def rollback():
    this.query_commit(this.rollback_sql(),{
    })