export const newDbAndCollectionCommand = `use quickstartDB
db.createCollection('sampleCollection')`;

export const newDbAndCollectionCommandForDisplay = `use quickstartDB // Create new database named 'quickstartDB' or switch to it if it already exists

db.createCollection('sampleCollection') // Create new collection named 'sampleCollection'`;

export const loadDataCommand = `db.sampleCollection.insertMany([
    {title: "The Great Gatsby", author: "F. Scott Fitzgerald", pages: 180},
    {title: "To Kill a Mockingbird", author: "Harper Lee", pages: 324},
    {title: "1984", author: "George Orwell", pages: 328},
    {title: "The Catcher in the Rye", author: "J.D. Salinger", pages: 277},
    {title: "Moby-Dick", author: "Herman Melville", pages: 720},
    {title: "Pride and Prejudice", author: "Jane Austen", pages: 279},
    {title: "The Hobbit", author: "J.R.R. Tolkien", pages: 310},
    {title: "War and Peace", author: "Leo Tolstoy", pages: 1392},
    {title: "The Odyssey", author: "Homer", pages: 374},
    {title: "Ulysses", author: "James Joyce", pages: 730}
  ])`;

export const queriesCommand = `db.sampleCollection.find({author: "George Orwell"})

db.sampleCollection.find({pages: {$gt: 500}})

db.sampleCollection.find({}).sort({pages: 1})`;

export const queriesCommandForDisplay = `// Query to find all books written by "George Orwell"
db.sampleCollection.find({author: "George Orwell"})

// Query to find all books with more than 500 pages
db.sampleCollection.find({pages: {$gt: 500}})

// Query to find all books and sort them by the number of pages in ascending order
db.sampleCollection.find({}).sort({pages: 1})`;
