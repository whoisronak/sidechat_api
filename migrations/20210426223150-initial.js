'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Initial migration. See models/ for more information
     */
    const sql = `
      CREATE TABLE IF NOT EXISTS "users" ("id"   SERIAL , "email" TEXT NOT NULL, "phone_number" VARCHAR(50) NOT NULL UNIQUE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));
      SELECT i.relname AS name, ix.indisprimary AS primary, ix.indisunique AS unique, ix.indkey AS indkey, array_agg(a.attnum) as column_indexes, array_agg(a.attname) AS column_names, pg_get_indexdef(ix.indexrelid) AS definition FROM pg_class t, pg_class i, pg_index ix, pg_attribute a WHERE t.oid = ix.indrelid AND i.oid = ix.indexrelid AND a.attrelid = t.oid AND t.relkind = 'r' and t.relname = 'users' GROUP BY i.relname, ix.indexrelid, ix.indisprimary, ix.indisunique, ix.indkey ORDER BY i.relname;

      CREATE TABLE IF NOT EXISTS "communities" ("id"   SERIAL , "name" TEXT NOT NULL UNIQUE, "edu_domain" TEXT UNIQUE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));
      SELECT i.relname AS name, ix.indisprimary AS primary, ix.indisunique AS unique, ix.indkey AS indkey, array_agg(a.attnum) as column_indexes, array_agg(a.attname) AS column_names, pg_get_indexdef(ix.indexrelid) AS definition FROM pg_class t, pg_class i, pg_index ix, pg_attribute a WHERE t.oid = ix.indrelid AND i.oid = ix.indexrelid AND a.attrelid = t.oid AND t.relkind = 'r' and t.relname = 'communities' GROUP BY i.relname, ix.indexrelid, ix.indisprimary, ix.indisunique, ix.indkey ORDER BY i.relname;

      CREATE TABLE IF NOT EXISTS "posts" ("id"   SERIAL , "user_id" INTEGER NOT NULL REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE CASCADE, "community_id" INTEGER NOT NULL REFERENCES "communities" ("id") ON DELETE NO ACTION ON UPDATE CASCADE, "video_url" TEXT, "thumbnail" TEXT, "aspect_ratio_width" INTEGER, "aspect_ratio_height" INTEGER, "upvotes" INTEGER NOT NULL DEFAULT 0, "number_of_comments" INTEGER NOT NULL DEFAULT 0, "text" VARCHAR(10000), "is_ready" BOOLEAN NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));
      SELECT i.relname AS name, ix.indisprimary AS primary, ix.indisunique AS unique, ix.indkey AS indkey, array_agg(a.attnum) as column_indexes, array_agg(a.attname) AS column_names, pg_get_indexdef(ix.indexrelid) AS definition FROM pg_class t, pg_class i, pg_index ix, pg_attribute a WHERE t.oid = ix.indrelid AND i.oid = ix.indexrelid AND a.attrelid = t.oid AND t.relkind = 'r' and t.relname = 'posts' GROUP BY i.relname, ix.indexrelid, ix.indisprimary, ix.indisunique, ix.indkey ORDER BY i.relname;
      CREATE INDEX "posts_community_id" ON "posts" ("community_id");
      CREATE INDEX "posts_user_id" ON "posts" ("user_id");

      CREATE TABLE IF NOT EXISTS "comments" ("id"   SERIAL , "user_id" INTEGER NOT NULL REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE CASCADE, "post_id" INTEGER NOT NULL REFERENCES "posts" ("id") ON DELETE NO ACTION ON UPDATE CASCADE, "upvotes" INTEGER NOT NULL DEFAULT 0, "text" VARCHAR(10000), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));
      SELECT i.relname AS name, ix.indisprimary AS primary, ix.indisunique AS unique, ix.indkey AS indkey, array_agg(a.attnum) as column_indexes, array_agg(a.attname) AS column_names, pg_get_indexdef(ix.indexrelid) AS definition FROM pg_class t, pg_class i, pg_index ix, pg_attribute a WHERE t.oid = ix.indrelid AND i.oid = ix.indexrelid AND a.attrelid = t.oid AND t.relkind = 'r' and t.relname = 'comments' GROUP BY i.relname, ix.indexrelid, ix.indisprimary, ix.indisunique, ix.indkey ORDER BY i.relname;
      CREATE INDEX "comments_post_id" ON "comments" ("post_id");
      CREATE INDEX "comments_user_id" ON "comments" ("user_id");

      CREATE TABLE IF NOT EXISTS "post_votes" ("id"   SERIAL , "user_id" INTEGER NOT NULL REFERENCES "users" ("id"), "post_id" INTEGER NOT NULL REFERENCES "posts" ("id"), "is_upvote" BOOLEAN NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, UNIQUE ("user_id", "post_id"), PRIMARY KEY ("id"));
      SELECT i.relname AS name, ix.indisprimary AS primary, ix.indisunique AS unique, ix.indkey AS indkey, array_agg(a.attnum) as column_indexes, array_agg(a.attname) AS column_names, pg_get_indexdef(ix.indexrelid) AS definition FROM pg_class t, pg_class i, pg_index ix, pg_attribute a WHERE t.oid = ix.indrelid AND i.oid = ix.indexrelid AND a.attrelid = t.oid AND t.relkind = 'r' and t.relname = 'post_votes' GROUP BY i.relname, ix.indexrelid, ix.indisprimary, ix.indisunique, ix.indkey ORDER BY i.relname;
      CREATE INDEX "post_votes_post_id" ON "post_votes" ("post_id");
      CREATE INDEX "post_votes_user_id" ON "post_votes" ("user_id");

      CREATE TABLE IF NOT EXISTS "comment_votes" ("id"   SERIAL , "user_id" INTEGER NOT NULL REFERENCES "users" ("id"), "comment_id" INTEGER NOT NULL REFERENCES "comments" ("id"), "is_upvote" BOOLEAN NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, UNIQUE ("user_id", "comment_id"), PRIMARY KEY ("id"));
      SELECT i.relname AS name, ix.indisprimary AS primary, ix.indisunique AS unique, ix.indkey AS indkey, array_agg(a.attnum) as column_indexes, array_agg(a.attname) AS column_names, pg_get_indexdef(ix.indexrelid) AS definition FROM pg_class t, pg_class i, pg_index ix, pg_attribute a WHERE t.oid = ix.indrelid AND i.oid = ix.indexrelid AND a.attrelid = t.oid AND t.relkind = 'r' and t.relname = 'comment_votes' GROUP BY i.relname, ix.indexrelid, ix.indisprimary, ix.indisunique, ix.indkey ORDER BY i.relname;
      CREATE INDEX "comment_votes_comment_id" ON "comment_votes" ("comment_id");
      CREATE INDEX "comment_votes_user_id" ON "comment_votes" ("user_id");

      CREATE TABLE IF NOT EXISTS "post_flags" ("id"   SERIAL , "user_id" INTEGER NOT NULL REFERENCES "users" ("id"), "post_id" INTEGER NOT NULL REFERENCES "posts" ("id"), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, UNIQUE ("user_id", "post_id"), PRIMARY KEY ("id"));
      SELECT i.relname AS name, ix.indisprimary AS primary, ix.indisunique AS unique, ix.indkey AS indkey, array_agg(a.attnum) as column_indexes, array_agg(a.attname) AS column_names, pg_get_indexdef(ix.indexrelid) AS definition FROM pg_class t, pg_class i, pg_index ix, pg_attribute a WHERE t.oid = ix.indrelid AND i.oid = ix.indexrelid AND a.attrelid = t.oid AND t.relkind = 'r' and t.relname = 'post_flags' GROUP BY i.relname, ix.indexrelid, ix.indisprimary, ix.indisunique, ix.indkey ORDER BY i.relname;
      CREATE INDEX "post_flags_post_id" ON "post_flags" ("post_id");
      CREATE INDEX "post_flags_user_id" ON "post_flags" ("user_id");

      CREATE TABLE IF NOT EXISTS "comment_flags" ("id"   SERIAL , "user_id" INTEGER NOT NULL REFERENCES "users" ("id"), "comment_id" INTEGER NOT NULL REFERENCES "comments" ("id"), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, UNIQUE ("user_id", "comment_id"), PRIMARY KEY ("id"));
      SELECT i.relname AS name, ix.indisprimary AS primary, ix.indisunique AS unique, ix.indkey AS indkey, array_agg(a.attnum) as column_indexes, array_agg(a.attname) AS column_names, pg_get_indexdef(ix.indexrelid) AS definition FROM pg_class t, pg_class i, pg_index ix, pg_attribute a WHERE t.oid = ix.indrelid AND i.oid = ix.indexrelid AND a.attrelid = t.oid AND t.relkind = 'r' and t.relname = 'comment_flags' GROUP BY i.relname, ix.indexrelid, ix.indisprimary, ix.indisunique, ix.indkey ORDER BY i.relname;
      CREATE INDEX "comment_flags_comment_id" ON "comment_flags" ("comment_id");
      CREATE INDEX "comment_flags_user_id" ON "comment_flags" ("user_id");

      CREATE TABLE IF NOT EXISTS "hot_posts" ("id"   SERIAL , "community_id" INTEGER NOT NULL REFERENCES "communities" ("id"), "post_ids" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[], "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));
      SELECT i.relname AS name, ix.indisprimary AS primary, ix.indisunique AS unique, ix.indkey AS indkey, array_agg(a.attnum) as column_indexes, array_agg(a.attname) AS column_names, pg_get_indexdef(ix.indexrelid) AS definition FROM pg_class t, pg_class i, pg_index ix, pg_attribute a WHERE t.oid = ix.indrelid AND i.oid = ix.indexrelid AND a.attrelid = t.oid AND t.relkind = 'r' and t.relname = 'hot_posts' GROUP BY i.relname, ix.indexrelid, ix.indisprimary, ix.indisunique, ix.indkey ORDER BY i.relname;
      CREATE INDEX "hot_posts_community_id" ON "hot_posts" ("community_id");

      CREATE TABLE IF NOT EXISTS "top_posts" ("id"   SERIAL , "community_id" INTEGER NOT NULL REFERENCES "communities" ("id"), "post_ids" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[], "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));
      SELECT i.relname AS name, ix.indisprimary AS primary, ix.indisunique AS unique, ix.indkey AS indkey, array_agg(a.attnum) as column_indexes, array_agg(a.attname) AS column_names, pg_get_indexdef(ix.indexrelid) AS definition FROM pg_class t, pg_class i, pg_index ix, pg_attribute a WHERE t.oid = ix.indrelid AND i.oid = ix.indexrelid AND a.attrelid = t.oid AND t.relkind = 'r' and t.relname = 'top_posts' GROUP BY i.relname, ix.indexrelid, ix.indisprimary, ix.indisunique, ix.indkey ORDER BY i.relname;
      CREATE INDEX "top_posts_community_id" ON "top_posts" ("community_id");

      CREATE TABLE IF NOT EXISTS "uuids" ("uuid" TEXT , PRIMARY KEY ("uuid"));
      SELECT i.relname AS name, ix.indisprimary AS primary, ix.indisunique AS unique, ix.indkey AS indkey, array_agg(a.attnum) as column_indexes, array_agg(a.attname) AS column_names, pg_get_indexdef(ix.indexrelid) AS definition FROM pg_class t, pg_class i, pg_index ix, pg_attribute a WHERE t.oid = ix.indrelid AND i.oid = ix.indexrelid AND a.attrelid = t.oid AND t.relkind = 'r' and t.relname = 'uuids' GROUP BY i.relname, ix.indexrelid, ix.indisprimary, ix.indisunique, ix.indkey ORDER BY i.relname;

      CREATE TABLE IF NOT EXISTS "phone_number_verification_code_map" ("phone_number" VARCHAR(50) NOT NULL UNIQUE , "verification_code" VARCHAR(10) NOT NULL, "num_tries" INTEGER NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("phone_number"));
      SELECT i.relname AS name, ix.indisprimary AS primary, ix.indisunique AS unique, ix.indkey AS indkey, array_agg(a.attnum) as column_indexes, array_agg(a.attname) AS column_names, pg_get_indexdef(ix.indexrelid) AS definition FROM pg_class t, pg_class i, pg_index ix, pg_attribute a WHERE t.oid = ix.indrelid AND i.oid = ix.indexrelid AND a.attrelid = t.oid AND t.relkind = 'r' and t.relname = 'phone_number_verification_code_map' GROUP BY i.relname, ix.indexrelid, ix.indisprimary, ix.indisunique, ix.indkey ORDER BY i.relname;

      CREATE TABLE IF NOT EXISTS "user_community_map" ("id"   SERIAL , "user_id" INTEGER NOT NULL REFERENCES "users" ("id"), "community_id" INTEGER NOT NULL REFERENCES "communities" ("id"), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, UNIQUE ("user_id", "community_id"), PRIMARY KEY ("id"));
      SELECT i.relname AS name, ix.indisprimary AS primary, ix.indisunique AS unique, ix.indkey AS indkey, array_agg(a.attnum) as column_indexes, array_agg(a.attname) AS column_names, pg_get_indexdef(ix.indexrelid) AS definition FROM pg_class t, pg_class i, pg_index ix, pg_attribute a WHERE t.oid = ix.indrelid AND i.oid = ix.indexrelid AND a.attrelid = t.oid AND t.relkind = 'r' and t.relname = 'user_community_map' GROUP BY i.relname, ix.indexrelid, ix.indisprimary, ix.indisunique, ix.indkey ORDER BY i.relname;
      CREATE INDEX "user_community_map_user_id" ON "user_community_map" ("user_id");
      CREATE INDEX "user_community_map_community_id" ON "user_community_map" ("community_id");
     `;
      return queryInterface.sequelize.query(sql, {
        type: Sequelize.QueryTypes.RAW
      });
  },

  down: async (queryInterface, Sequelize) => {
    // I don't have the drop tables here because I don't want someone
    // to accidentally down migrate here. If someone wants to delete
    // they should create another up migration
    const sql = `
     `;
     return queryInterface.sequelize.query(sql, {
      type: Sequelize.QueryTypes.RAW
    });
  }
};
