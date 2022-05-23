'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Initial migration. See models/ for more information
     */
    const sql = `
      DROP TABLE IF EXISTS "users" CASCADE;
      CREATE TABLE IF NOT EXISTS "users" ("id"   SERIAL , "email" TEXT, "first_name" TEXT, "last_name" TEXT, "display_name" TEXT, "phone_number" VARCHAR(50) NOT NULL UNIQUE, "address1" TEXT, "address2" TEXT, "city" TEXT, "state" TEXT, "zip" TEXT, "country" TEXT, "stripe_customer_id" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));
      SELECT i.relname AS name, ix.indisprimary AS primary, ix.indisunique AS unique, ix.indkey AS indkey, array_agg(a.attnum) as column_indexes, array_agg(a.attname) AS column_names, pg_get_indexdef(ix.indexrelid) AS definition FROM pg_class t, pg_class i, pg_index ix, pg_attribute a WHERE t.oid = ix.indrelid AND i.oid = ix.indexrelid AND a.attrelid = t.oid AND t.relkind = 'r' and t.relname = 'users' GROUP BY i.relname, ix.indexrelid, ix.indisprimary, ix.indisunique, ix.indkey ORDER BY i.relname;
      DROP TABLE IF EXISTS "clubs" CASCADE;
      CREATE TABLE IF NOT EXISTS "clubs" ("id"   SERIAL , "name" TEXT, "about" TEXT, "deck" TEXT, "faq" TEXT, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));
      SELECT i.relname AS name, ix.indisprimary AS primary, ix.indisunique AS unique, ix.indkey AS indkey, array_agg(a.attnum) as column_indexes, array_agg(a.attname) AS column_names, pg_get_indexdef(ix.indexrelid) AS definition FROM pg_class t, pg_class i, pg_index ix, pg_attribute a WHERE t.oid = ix.indrelid AND i.oid = ix.indexrelid AND a.attrelid = t.oid AND t.relkind = 'r' and t.relname = 'clubs' GROUP BY i.relname, ix.indexrelid, ix.indisprimary, ix.indisunique, ix.indkey ORDER BY i.relname;
      DROP TABLE IF EXISTS "club_documents" CASCADE;
      CREATE TABLE IF NOT EXISTS "club_documents" ("id"   SERIAL , "club_id" INTEGER NOT NULL REFERENCES "clubs" ("id"), "document" TEXT NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));
      SELECT i.relname AS name, ix.indisprimary AS primary, ix.indisunique AS unique, ix.indkey AS indkey, array_agg(a.attnum) as column_indexes, array_agg(a.attname) AS column_names, pg_get_indexdef(ix.indexrelid) AS definition FROM pg_class t, pg_class i, pg_index ix, pg_attribute a WHERE t.oid = ix.indrelid AND i.oid = ix.indexrelid AND a.attrelid = t.oid AND t.relkind = 'r' and t.relname = 'club_documents' GROUP BY i.relname, ix.indexrelid, ix.indisprimary, ix.indisunique, ix.indkey ORDER BY i.relname;
      CREATE INDEX "club_documents_club_id" ON "club_documents" ("club_id");
      DROP TABLE IF EXISTS "club_leaders" CASCADE;
      CREATE TABLE IF NOT EXISTS "club_leaders" ("id"   SERIAL , "user_id" INTEGER NOT NULL REFERENCES "users" ("id"), "club_id" INTEGER NOT NULL REFERENCES "clubs" ("id"), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));
      SELECT i.relname AS name, ix.indisprimary AS primary, ix.indisunique AS unique, ix.indkey AS indkey, array_agg(a.attnum) as column_indexes, array_agg(a.attname) AS column_names, pg_get_indexdef(ix.indexrelid) AS definition FROM pg_class t, pg_class i, pg_index ix, pg_attribute a WHERE t.oid = ix.indrelid AND i.oid = ix.indexrelid AND a.attrelid = t.oid AND t.relkind = 'r' and t.relname = 'club_leaders' GROUP BY i.relname, ix.indexrelid, ix.indisprimary, ix.indisunique, ix.indkey ORDER BY i.relname;
      CREATE INDEX "club_leaders_club_id" ON "club_leaders" ("club_id");
      CREATE INDEX "club_leaders_user_id" ON "club_leaders" ("user_id");
      DROP TABLE IF EXISTS "investments" CASCADE;
      CREATE TABLE IF NOT EXISTS "investments" ("id"   SERIAL , "user_id" INTEGER NOT NULL REFERENCES "users" ("id"), "club_id" INTEGER NOT NULL REFERENCES "clubs" ("id"), "amount" DECIMAL(10,2) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));
      SELECT i.relname AS name, ix.indisprimary AS primary, ix.indisunique AS unique, ix.indkey AS indkey, array_agg(a.attnum) as column_indexes, array_agg(a.attname) AS column_names, pg_get_indexdef(ix.indexrelid) AS definition FROM pg_class t, pg_class i, pg_index ix, pg_attribute a WHERE t.oid = ix.indrelid AND i.oid = ix.indexrelid AND a.attrelid = t.oid AND t.relkind = 'r' and t.relname = 'investments' GROUP BY i.relname, ix.indexrelid, ix.indisprimary, ix.indisunique, ix.indkey ORDER BY i.relname;
      CREATE INDEX "investments_club_id" ON "investments" ("club_id");
      CREATE INDEX "investments_user_id" ON "investments" ("user_id");
      DROP TABLE IF EXISTS "limited_partners" CASCADE;
      CREATE TABLE IF NOT EXISTS "limited_partners" ("id"   SERIAL , "user_id" INTEGER NOT NULL REFERENCES "users" ("id"), "club_id" INTEGER NOT NULL REFERENCES "clubs" ("id"), "last_time_challenge_notification_sent" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, UNIQUE ("user_id", "club_id"), PRIMARY KEY ("id"));
      SELECT i.relname AS name, ix.indisprimary AS primary, ix.indisunique AS unique, ix.indkey AS indkey, array_agg(a.attnum) as column_indexes, array_agg(a.attname) AS column_names, pg_get_indexdef(ix.indexrelid) AS definition FROM pg_class t, pg_class i, pg_index ix, pg_attribute a WHERE t.oid = ix.indrelid AND i.oid = ix.indexrelid AND a.attrelid = t.oid AND t.relkind = 'r' and t.relname = 'limited_partners' GROUP BY i.relname, ix.indexrelid, ix.indisprimary, ix.indisunique, ix.indkey ORDER BY i.relname;
      CREATE INDEX "limited_partners_club_id" ON "limited_partners" ("club_id");
      CREATE INDEX "limited_partners_user_id" ON "limited_partners" ("user_id");
      DROP TABLE IF EXISTS "signed_documents" CASCADE;
      CREATE TABLE IF NOT EXISTS "signed_documents" ("id"   SERIAL , "user_id" INTEGER NOT NULL REFERENCES "users" ("id"), "club_document_id" INTEGER NOT NULL REFERENCES "club_documents" ("id"), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, UNIQUE ("user_id", "club_document_id"), PRIMARY KEY ("id"));
      SELECT i.relname AS name, ix.indisprimary AS primary, ix.indisunique AS unique, ix.indkey AS indkey, array_agg(a.attnum) as column_indexes, array_agg(a.attname) AS column_names, pg_get_indexdef(ix.indexrelid) AS definition FROM pg_class t, pg_class i, pg_index ix, pg_attribute a WHERE t.oid = ix.indrelid AND i.oid = ix.indexrelid AND a.attrelid = t.oid AND t.relkind = 'r' and t.relname = 'signed_documents' GROUP BY i.relname, ix.indexrelid, ix.indisprimary, ix.indisunique, ix.indkey ORDER BY i.relname;
      CREATE INDEX "signed_documents_club_document_id" ON "signed_documents" ("club_document_id");
      CREATE INDEX "signed_documents_user_id" ON "signed_documents" ("user_id");
      DROP TABLE IF EXISTS "docusign_key" CASCADE;
      CREATE TABLE IF NOT EXISTS "docusign_key" ("id"   SERIAL , "docusign_key_id" INTEGER NOT NULL UNIQUE, "key" TEXT NOT NULL, "expires" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));
      SELECT i.relname AS name, ix.indisprimary AS primary, ix.indisunique AS unique, ix.indkey AS indkey, array_agg(a.attnum) as column_indexes, array_agg(a.attname) AS column_names, pg_get_indexdef(ix.indexrelid) AS definition FROM pg_class t, pg_class i, pg_index ix, pg_attribute a WHERE t.oid = ix.indrelid AND i.oid = ix.indexrelid AND a.attrelid = t.oid AND t.relkind = 'r' and t.relname = 'docusign_key' GROUP BY i.relname, ix.indexrelid, ix.indisprimary, ix.indisunique, ix.indkey ORDER BY i.relname;
     `;
      return queryInterface.sequelize.query(sql, {
        type: Sequelize.QueryTypes.RAW
      });
  },

  down: async (queryInterface, Sequelize) => {
    const sql = `
      DROP TABLE IF EXISTS "docusign_key" CASCADE;
      DROP TABLE IF EXISTS "signed_documents" CASCADE;
      DROP TABLE IF EXISTS "limited_partners" CASCADE;
      DROP TABLE IF EXISTS "investments" CASCADE;
      DROP TABLE IF EXISTS "club_leaders" CASCADE;
      DROP TABLE IF EXISTS "club_documents" CASCADE;
      DROP TABLE IF EXISTS "clubs" CASCADE;
      DROP TABLE IF EXISTS "users" CASCADE;
     `;
     return queryInterface.sequelize.query(sql, {
      type: Sequelize.QueryTypes.RAW
    });
  }
};
