import { PrismaClient } from "./gen/client";

const prisma = new PrismaClient();

async function initDatabase() {
  await prisma.country.create({
    data: {
      name: "United States of America",
      abbreviation: "USA",
      states: {
        create: [
          {
            name: "Alabama",
            abbreviation: "AL",
          },
          {
            name: "Alaska",
            abbreviation: "AK",
          },
          {
            name: "American Samoa",
            abbreviation: "AS",
          },
          {
            name: "Arizona",
            abbreviation: "AZ",
          },
          {
            name: "Arkansas",
            abbreviation: "AR",
          },
          {
            name: "California",
            abbreviation: "CA",
          },
          {
            name: "Colorado",
            abbreviation: "CO",
          },
          {
            name: "Connecticut",
            abbreviation: "CT",
          },
          {
            name: "Delaware",
            abbreviation: "DE",
          },
          {
            name: "District Of Columbia",
            abbreviation: "DC",
          },
          {
            name: "Federated States Of Micronesia",
            abbreviation: "FM",
          },
          {
            name: "Florida",
            abbreviation: "FL",
          },
          {
            name: "Georgia",
            abbreviation: "GA",
          },
          {
            name: "Guam",
            abbreviation: "GU",
          },
          {
            name: "Hawaii",
            abbreviation: "HI",
          },
          {
            name: "Idaho",
            abbreviation: "ID",
          },
          {
            name: "Illinois",
            abbreviation: "IL",
          },
          {
            name: "Indiana",
            abbreviation: "IN",
          },
          {
            name: "Iowa",
            abbreviation: "IA",
          },
          {
            name: "Kansas",
            abbreviation: "KS",
          },
          {
            name: "Kentucky",
            abbreviation: "KY",
          },
          {
            name: "Louisiana",
            abbreviation: "LA",
          },
          {
            name: "Maine",
            abbreviation: "ME",
          },
          {
            name: "Marshall Islands",
            abbreviation: "MH",
          },
          {
            name: "Maryland",
            abbreviation: "MD",
          },
          {
            name: "Massachusetts",
            abbreviation: "MA",
          },
          {
            name: "Michigan",
            abbreviation: "MI",
          },
          {
            name: "Minnesota",
            abbreviation: "MN",
          },
          {
            name: "Mississippi",
            abbreviation: "MS",
          },
          {
            name: "Missouri",
            abbreviation: "MO",
          },
          {
            name: "Montana",
            abbreviation: "MT",
          },
          {
            name: "Nebraska",
            abbreviation: "NE",
          },
          {
            name: "Nevada",
            abbreviation: "NV",
          },
          {
            name: "New Hampshire",
            abbreviation: "NH",
          },
          {
            name: "New Jersey",
            abbreviation: "NJ",
          },
          {
            name: "New Mexico",
            abbreviation: "NM",
          },
          {
            name: "New York",
            abbreviation: "NY",
          },
          {
            name: "North Carolina",
            abbreviation: "NC",
          },
          {
            name: "North Dakota",
            abbreviation: "ND",
          },
          {
            name: "Northern Mariana Islands",
            abbreviation: "MP",
          },
          {
            name: "Ohio",
            abbreviation: "OH",
          },
          {
            name: "Oklahoma",
            abbreviation: "OK",
          },
          {
            name: "Oregon",
            abbreviation: "OR",
          },
          {
            name: "Palau",
            abbreviation: "PW",
          },
          {
            name: "Pennsylvania",
            abbreviation: "PA",
          },
          {
            name: "Puerto Rico",
            abbreviation: "PR",
          },
          {
            name: "Rhode Island",
            abbreviation: "RI",
          },
          {
            name: "South Carolina",
            abbreviation: "SC",
          },
          {
            name: "South Dakota",
            abbreviation: "SD",
          },
          {
            name: "Tennessee",
            abbreviation: "TN",
          },
          {
            name: "Texas",
            abbreviation: "TX",
          },
          {
            name: "Utah",
            abbreviation: "UT",
          },
          {
            name: "Vermont",
            abbreviation: "VT",
          },
          {
            name: "Virgin Islands",
            abbreviation: "VI",
          },
          {
            name: "Virginia",
            abbreviation: "VA",
          },
          {
            name: "Washington",
            abbreviation: "WA",
          },
          {
            name: "West Virginia",
            abbreviation: "WV",
          },
          {
            name: "Wisconsin",
            abbreviation: "WI",
          },
          {
            name: "Wyoming",
            abbreviation: "WY",
          },
        ],
      },
    },
  });
}

async function upsertAddress(address: {
  street1?: string;
  street2?: string;
  street3?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}): Promise<{ id: string }> {
  const countryFilter = address.country ?? "United States of America";
  const [country] = await prisma.country.findMany({
    select: { id: true, name: true },
    where: { OR: [{ name: countryFilter }, { abbreviation: countryFilter }] },
    first: 1,
  });
  if (country == null) {
    throw new Error(`No country found with name or abbreviation of "${countryFilter}".`);
  }

  let state: { id: string; name: string } | null;
  if (!address.state) {
    state = null;
  } else {
    const stateUpper = address.state.toUpperCase();
    [state] = await prisma.state.findMany({
      select: { id: true, name: true },
      where: {
        country: { id: country.id },
        OR: [
          {
            name: stateUpper,
          },
          { abbreviation: stateUpper },
        ],
      },
      first: 1,
    });
    if (state == null) {
      throw new Error(`No state found with name or abbreviation of "${stateUpper}" inside of country "${country.name}".`);
    }
  }

  let city: { id: string; name: string } | null;
  if (!address.city) {
    city = null;
  } else {
    [city] = await prisma.city.findMany({
      select: { id: true, name: true },
      where: {
        country: { id: country.id },
        ...(state == null ? {} : { state: { id: state.id } }),
        OR: [
          {
            name: address.city,
          },
          {
            aliases: {
              some: {
                name: address.city,
              },
            },
          },
        ],
      },
      first: 1,
    });
    if (city == null) {
      city = await prisma.city.create({
        data: {
          name: address.city,
          country: { connect: { id: country.id } },
          state: state && { connect: { id: state.id } },
        },
      });
    }
  }

  let zip: { id: string; code: string } | null;
  if (!address.zip) {
    zip = null;
  } else {
    [zip] = await prisma.zip.findMany({
      select: { id: true, code: true },
      where: {
        code: address.zip,
        country: { id: country.id },
      },
      first: 1,
    });
    if (zip == null) {
      zip = await prisma.zip.create({
        data: {
          code: address.zip,
          country: { connect: { id: country.id } },
        },
      });
    }
  }

  let record: { id: string };
  [record] = await prisma.address.findMany({
    select: { id: true },
    where: {
      street1: address.street1 ?? "",
      street2: address.street2 ?? "",
      street3: address.street3 ?? "",
      // country: { id: country.id },
      state: state && { id: state.id },
      city: city && { id: city.id },
      zip: zip && { id: zip.id },
    },
    first: 1,
  });
  if (record == null) {
    record = await prisma.address.create({
      select: { id: true },
      data: {
        street1: address.street1 ?? "",
        street2: address.street2 ?? "",
        street3: address.street3 ?? "",
        // country: { id: country.id },
        state: state && { connect: { id: state.id } },
        city: city && { connect: { id: city.id } },
        zip: zip && { connect: { id: zip.id } },
      },
    });
  }
  return record;
}

// A `main` function so that we can use async/await
async function main() {
  try {
    console.log("Try initializing database");
    await initDatabase();
  } catch (ex) {
    console.error(ex);
    console.log("Nvm, database initialized already");
  }
  const address = await upsertAddress({
    street1: "1 Main St",
    street2: "Ste 108",
    street3: "Office C",
    city: "New Orleans",
    state: "LA",
    zip: "70117",
    country: "United States of America",
  });

  const person = await prisma.person.create({
    select: { id: true, emails: { select: { id: true } } },
    data: {
      name: {
        create: {
          firstName: "Franklin",
          lastName: "Davenport",
        },
      },
      addresses: {
        create: [
          {
            type: "WORK",
            address: { connect: { id: address.id } },
          },
        ],
      },
      emails: {
        create: [
          {
            email: "sparebytes@gmail.com",
            type: "PERSONAL",
          },
        ],
      },
    },
  });

  const user = await prisma.user.create({
    data: {
      person: { connect: { id: person.id } },
      primaryEmail: { connect: { id: person.emails[0].id } },
    },
  });

  console.log(user);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.disconnect();
  });
