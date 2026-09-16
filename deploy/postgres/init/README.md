# Postgres init scripts

Files in this directory run once when the local Postgres volume is first created
(`/docker-entrypoint-initdb.d`). Use them only to create per-service databases and roles,
for example `001-create-databases.sql`. Schema migrations belong to each service under
`migrations/` and are applied by `golang-migrate`, never here.
