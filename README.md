# Marketplace API


Voor mijn Node project heb ik een REST API gemaakt voor een marketplace waar gebruikers, skins kunnen bekijken, listings aanmaken en items kunnen kopen. Ze kunnen ook hun transacties bekijken.

Live API: https://marketplace-xbmm.onrender.com  
API documentatie: https://marketplace-xbmm.onrender.com/api-docs

## Technologieen

- Node.js
- Express
- MongoDB
- Mongoose
- Joi
- bcrypt
- jsonwebtoken
- cors
- swagger-ui-express
- Node.js test runner

## Installatie

Clone het project en installeer de dependencies:

```bash
npm install
```

Maak een `.env` bestand aan in de root van het project:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/marketplace
JWT_SECRET=your_secret_key
PORT=3000
```

Start de API lokaal:

```bash
node index.js
```

De API draait dan op:

```text
http://localhost:3000
```

## Testen

Automatische tests draaien:

```bash
npm test
```

De tests gebruiken de Node.js built-in test runner. Ze controleren onder andere:

- registreren en inloggen
- JWT-authenticatie
- admin-only routes
- ObjectId-validatie
- listings aanmaken
- listings kopen
- transacties ophalen
- Swagger documentatie endpoint

Daarnaast staat er een REST Client bestand in:

```text
tests/tests.http
```

Daarmee kunnen de endpoints handmatig getest worden in VS Code.

## Authenticatie

De API gebruikt JWT-authenticatie. Na het inloggen krijg je een token terug. Dat token moet bij beveiligde routes worden meegegeven via deze header:

```http
x-auth-token: jouw_token
```

Er zijn drie soorten gebruikers:

- Guest: kan publieke data bekijken, zoals skins en actieve listings.
- User: kan eigen profiel bekijken, listings maken en items kopen.
- Admin: kan users en skins beheren en alle transacties bekijken.

JWT tokens verlopen na 1 uur.

## Database

De API gebruikt MongoDB met Mongoose models.

Collections:

- `users`
- `skins`
- `listings`
- `transactions`

De collections zijn met elkaar verbonden:

- Een listing verwijst naar een seller uit `users`.
- Een listing verwijst naar een skin uit `skins`.
- Een transaction verwijst naar buyer en seller uit `users`.
- Een transaction verwijst naar een listing uit `listings`.
- Users hebben een inventory met embedded skin documents.
- Listings bewaren daarnaast een embedded skin snapshot, zodat de verkochte skin op dat moment vastligt.

## Endpoints

### Home

| Method | Endpoint | Auth | Beschrijving |
| --- | --- | --- | --- |
| GET | `/` | Nee | Simpele startpagina met link naar Swagger |
| GET | `/api-docs` | Nee | Swagger UI documentatie |
| GET | `/api-docs.json` | Nee | OpenAPI JSON |

### Auth

| Method | Endpoint | Auth | Beschrijving |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Nee | Nieuwe gebruiker registreren |
| POST | `/api/auth/login` | Nee | Inloggen en JWT ontvangen |

### Skins

| Method | Endpoint | Auth | Beschrijving |
| --- | --- | --- | --- |
| GET | `/api/skins` | Nee | Alle skins ophalen |
| GET | `/api/skins/rarity/:rarity` | Nee | Skins filteren op rarity |
| GET | `/api/skins/:id` | Nee | Skin ophalen op id |
| POST | `/api/skins` | Admin | Nieuwe skin toevoegen |
| PUT | `/api/skins/:id` | Admin | Skin aanpassen |
| DELETE | `/api/skins/:id` | Admin | Skin verwijderen |

### Users

| Method | Endpoint | Auth | Beschrijving |
| --- | --- | --- | --- |
| GET | `/api/users` | Admin | Alle gebruikers ophalen |
| GET | `/api/users/me` | User | Eigen profiel ophalen |
| GET | `/api/users/me/inventory` | User | Eigen inventory ophalen |
| GET | `/api/users/:id` | Admin | Gebruiker ophalen op id |
| POST | `/api/users` | Admin | Nieuwe gebruiker aanmaken |
| PUT | `/api/users/:id` | Admin | Gebruiker aanpassen |
| DELETE | `/api/users/:id` | Admin | Gebruiker verwijderen |

### Listings

| Method | Endpoint | Auth | Beschrijving |
| --- | --- | --- | --- |
| GET | `/api/listings` | Nee | Alle actieve listings ophalen |
| GET | `/api/listings/search` | Nee | Listings zoeken met query parameters |
| GET | `/api/listings/my-listings` | User | Eigen listings ophalen |
| GET | `/api/listings/:id` | Nee | Listing ophalen op id |
| POST | `/api/listings` | User | Nieuwe listing maken |
| POST | `/api/listings/:id/buy` | User | Listing kopen |
| PUT | `/api/listings/:id` | Seller/Admin | Listing aanpassen |
| DELETE | `/api/listings/:id` | Seller/Admin | Listing verwijderen |

Voorbeeld body om een listing te maken:

```json
{
  "price": 350,
  "skinId": "665f2d4b4c6a8a1b2c3d4e5f"
}
```

Voorbeeld zoekroute:

```http
GET /api/listings/search?maxPrice=500&rarity=Epic
```

### Transactions

| Method | Endpoint | Auth | Beschrijving |
| --- | --- | --- | --- |
| GET | `/api/transactions` | Admin | Alle transacties ophalen |
| GET | `/api/transactions/my-transactions` | User | Eigen transacties ophalen |
| GET | `/api/transactions/:id` | User/Admin | Transactie ophalen op id |

## Swagger

De Swagger documentatie is beschikbaar via:

```text
https://marketplace-xbmm.onrender.com/api-docs
```

In Swagger kan je ook beveiligde endpoints testen. Klik op `Authorize` en vul je JWT token in bij `x-auth-token`.

## Deployment

De API is gedeployed op Render.

Belangrijke instellingen:

- Build command: `npm install`
- Start command: `node index.js`
- Environment variables:
  - `MONGO_URI`
  - `JWT_SECRET`
  - `PORT`

MongoDB draait via MongoDB Atlas. De connection string staat niet in de code, maar in environment variables.

## Security

- Wachtwoorden worden gehasht met bcrypt.
- JWT tokens verlopen na 1 uur.
- `JWT_SECRET` is verplicht en staat in environment variables.
- Admin routes zijn beveiligd met auth en admin middleware.
- ObjectId parameters worden gevalideerd voor MongoDB queries.
- Gebruikers kunnen zichzelf geen admin maken via register/login.
- Passwords worden niet teruggestuurd in user responses.
- `.env` staat in `.gitignore`.

## Projectstructuur

```text
middleware/
models/
routes/
tests/
index.js
swagger.json
package.json
```

## Auteur

Joussef Boulbane
