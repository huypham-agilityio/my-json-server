## Deploy JSON Server to Vercel

A template to deploy [JSON Server](https://github.com/typicode/json-server) to [Vercel](https://vercel.com), allow you to run fake REST API online!

Once deployed, the API is available at:

1. `https://<your-deployment>`
2. `https://<your-deployment>/api/foods`

### How to use

1. Click "**Use this template**" or clone this repository.
2. Update or use the default [`db.json`](./db.json) in the repository.
3. Sign Up or login into [Vercel](https://vercel.com).
4. From the Vercel dashboard, click "**+ New Project**" then "**Import**" your repository.
5. In the "**Configure Project**" screen, leave everything default and click "**Deploy**".
6. Wait until deployment is done, and your own JSON server is ready to serve!

## Breaking changes

- The field `ingredi<b>a</b>nts` (misspelled) on `foods` records was renamed to `ingredients`.
  There is no alias for the old name: frontend code must read `ingredients`.

## API

### Base URL

- Deployed: `https://<your-deployment>`
- Local: `http://localhost:3000`

Every path can be called with or without the `/api` prefix: `/api/foods` and `/foods` return the same data.

### Resource: `foods`

| Field         | Type                         | Notes                                        |
| ------------- | ---------------------------- | -------------------------------------------- |
| `id`          | string                       | e.g. `"1"` (a string, not a number)          |
| `title`       | string                       | Name of the food                             |
| `info`        | string                       | Short info, e.g. `"55 cal/100g"`             |
| `image`       | string                       | Image URL                                    |
| `category`    | string                       | e.g. `"Lunch"`                               |
| `nutrition`   | array of `{ name, value }`   | Both strings, e.g. `{ "name": "Fat", "value": "100g" }` |
| `ingredients` | array of `{ name, value }`   | Both strings, e.g. `{ "name": "Bread", "value": "20g" }` |
| `description` | string                       | Longer description                           |

Example record (`GET /api/foods/1`):

```json
{
  "id": "1",
  "title": "Banana",
  "info": "55 cal/100g",
  "image": "https://i.postimg.cc/nVWwWv6w/Group-36216.png",
  "category": "Lunch",
  "nutrition": [
    { "name": "Protein", "value": "450g" },
    { "name": "Calories", "value": "220g" },
    { "name": "Fat", "value": "100g" },
    { "name": "Carbs", "value": "49g" }
  ],
  "ingredients": [
    { "name": "Bread", "value": "20g" },
    { "name": "Meat (Chicken)", "value": "40g" },
    { "name": "Cacumber", "value": "30g" },
    { "name": "Onion", "value": "20g" }
  ],
  "description": "A hamburger (also burger for short) is a sandwich consisting of one or more cooked patties of ground meat, usually beef, placed inside a sliced bread"
}
```

### Endpoints

| Method | Path              | Description                                  |
| ------ | ----------------- | -------------------------------------------- |
| GET    | `/api/foods`      | List all foods                               |
| GET    | `/api/foods/:id`  | Get one food by id (`404` if it does not exist) |

JSON Server also accepts `POST`, `PUT`, `PATCH` and `DELETE` on these routes. Note that writes change the data stored in `db.json`.

### Query parameters

| What               | Parameters                | Example                                   |
| ------------------ | ------------------------- | ----------------------------------------- |
| Filter by category | `category=<value>`        | `/api/foods?category=Lunch`               |
| Pagination         | `_page=<n>&_limit=<size>` | `/api/foods?_page=1&_limit=5`             |
| Sort               | `_sort=<field>&_order=asc\|desc` | `/api/foods?_sort=title&_order=asc` |
| Full-text search   | `q=<text>`                | `/api/foods?q=banana`                     |

Paginated responses include an `X-Total-Count` header with the total number of matching records (for example `X-Total-Count: 10`).

Parameters can be combined, e.g. `/api/foods?category=Lunch&_sort=title&_order=asc`.

## Run locally

```sh
pnpm install
pnpm start
```

The server runs at http://localhost:3000 (try http://localhost:3000/api/foods).

## Tests

```sh
pnpm test
```

Runs a smoke test with Node's built-in test runner (Node 18 or later). It starts `server.js` on port 3000, so stop any local server first.

## Reference

1. https://github.com/typicode/json-server
2. https://vercel.com
3. https://shadowsmith.com/how-to-deploy-an-express-api-to-vercel
