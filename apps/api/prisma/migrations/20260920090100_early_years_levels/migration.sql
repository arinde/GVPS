-- Creche, Nursery 1–2 and KG 1–2 come before Primary 1. Existing ranks move
-- up by five — in two steps, because the (schoolId, rank) unique index is
-- checked row by row and a direct +5 would collide mid-update.
UPDATE "class_levels" SET "rank" = "rank" + 100;
UPDATE "class_levels" SET "rank" = "rank" - 95;

INSERT INTO "class_levels" ("id", "schoolId", "section", "name", "rank", "createdAt", "updatedAt")
SELECT 'lvl_' || md5(s."id" || v.name), s."id", 'NURSERY', v.name, v.rank, NOW(), NOW()
FROM "schools" s
CROSS JOIN (VALUES ('Creche', 1), ('Nursery 1', 2), ('Nursery 2', 3), ('KG 1', 4), ('KG 2', 5)) AS v(name, rank)
ON CONFLICT DO NOTHING;

-- One arm, "A", per new level, as the seed gives every other level.
INSERT INTO "class_arms" ("id", "schoolId", "classLevelId", "name", "createdAt", "updatedAt")
SELECT 'arm_' || md5(l."id"), l."schoolId", l."id", 'A', NOW(), NOW()
FROM "class_levels" l
WHERE l."section" = 'NURSERY'
ON CONFLICT DO NOTHING;
