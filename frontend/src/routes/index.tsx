import { ErrorNotFound } from "@/errors/notFound";
import { Layout } from "@/layout";
import DocPreview from "@/pages/docPreview";
import { createBrowserRouter } from "react-router-dom";
import Landing from "@/pages/landing"
import Messaging from "@/pages/messaging"
import OrganizationData from "@/pages/organizationData"
import Authentication from "@/pages/authentication"
import { PersonalData } from "@/pages/personalData";

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [{
      index: true,
      element: <Landing />
    },
    {
      path: '/thread/:id?',
      element: <Messaging />

    },
    {
      path: '/organization-data',
      element: <OrganizationData />
    },
    {
      path: '/personal-data',
      element: <PersonalData />
    },
    {
      path: 'doc-preview/:id',
      element: <DocPreview />
    },
    {
      path: '*',
      element: <ErrorNotFound />
    }]
  },
  {
    path: '/auth/:method?',
    element: <Authentication />
  },
]);