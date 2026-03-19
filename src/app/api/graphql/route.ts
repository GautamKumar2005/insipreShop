import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { NextRequest } from 'next/server';
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";

// Combine type definitions (schema)
const typeDefs = `#graphql
  type Product {
    _id: ID!
    name: String!
    price: Float!
    stock: Int!
    description: String
    category: String
    images: [Image]
    seller: User
  }

  type Image {
    url: String
    publicId: String
  }

  type User {
    _id: ID!
    name: String
    email: String
  }

  type Query {
    products: [Product]
    product(id: ID!): Product
  }
`;

// Define resolvers (how to fetch the data)
const resolvers = {
  Query: {
    products: async () => {
      await connectDB();
      return await Product.find({}).populate('seller', 'name email');
    },
    product: async (_: any, { id }: { id: string }) => {
      await connectDB();
      return await Product.findById(id).populate('seller', 'name email');
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Configure the Next.js API handler
const handler = startServerAndCreateNextHandler<NextRequest>(server, {
  context: async (req) => ({ req }),
});

export { handler as GET, handler as POST };
