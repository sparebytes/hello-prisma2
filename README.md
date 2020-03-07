# Prisma 2 Example Project

## Setup

```sh
yarn install
yarn devker up
yarn prisma2 migrate up --experimental
yarn prisma2 generate
```

## Reset the database

```sh
yarn devker destroy
yarn devker up
yarn prisma2 migrate up --experimental
```

## Update the schema

```sh
# Edit schema.prisma First
yarn prisma2 migrate save --name <NAME> --experimental
yarn prisma2 migrate up --experimental
yarn prisma2 generate
```
