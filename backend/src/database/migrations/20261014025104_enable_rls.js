/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`ALTER TABLE users ENABLE ROW LEVEL SECURITY;`);
  await knex.raw(`ALTER TABLE user_eras ENABLE ROW LEVEL SECURITY;`);
  await knex.raw(`ALTER TABLE user_categories ENABLE ROW LEVEL SECURITY;`);

  await knex.raw(`ALTER TABLE users FORCE ROW LEVEL SECURITY;`);
  await knex.raw(`ALTER TABLE user_eras FORCE ROW LEVEL SECURITY;`);
  await knex.raw(`ALTER TABLE user_categories FORCE ROW LEVEL SECURITY;`);

  await knex.raw(`
    CREATE POLICY "Users can view own profile"
    ON users
    FOR SELECT
    USING (
      id = auth.uid() 
      OR id::text = current_setting('app.current_user_id', true)
    );
  `);

  await knex.raw(`
    CREATE POLICY "Users can update own profile"
    ON users
    FOR UPDATE
    USING (
      id = auth.uid() 
      OR id::text = current_setting('app.current_user_id', true)
    );
  `);

  await knex.raw(`
    CREATE POLICY "Users can manage own eras"
    ON user_eras
    FOR ALL
    USING (
      user_id = auth.uid() 
      OR user_id::text = current_setting('app.current_user_id', true)
    )
    WITH CHECK (
      user_id = auth.uid() 
      OR user_id::text = current_setting('app.current_user_id', true)
    );
  `);

  await knex.raw(`
    CREATE POLICY "Users can manage own categories"
    ON user_categories
    FOR ALL
    USING (
      user_id = auth.uid() 
      OR user_id::text = current_setting('app.current_user_id', true)
    )
    WITH CHECK (
      user_id = auth.uid() 
      OR user_id::text = current_setting('app.current_user_id', true)
    );
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(`DROP POLICY IF EXISTS "Users can view own profile" ON users;`);
  await knex.raw(`DROP POLICY IF EXISTS "Users can update own profile" ON users;`);
  await knex.raw(`DROP POLICY IF EXISTS "Users can manage own eras" ON user_eras;`);
  await knex.raw(`DROP POLICY IF EXISTS "Users can manage own categories" ON user_categories;`);

  await knex.raw(`ALTER TABLE user_categories NO FORCE ROW LEVEL SECURITY;`);
  await knex.raw(`ALTER TABLE user_eras NO FORCE ROW LEVEL SECURITY;`);
  await knex.raw(`ALTER TABLE users NO FORCE ROW LEVEL SECURITY;`);

  await knex.raw(`ALTER TABLE user_categories DISABLE ROW LEVEL SECURITY;`);
  await knex.raw(`ALTER TABLE user_eras DISABLE ROW LEVEL SECURITY;`);
  await knex.raw(`ALTER TABLE users DISABLE ROW LEVEL SECURITY;`);
};
