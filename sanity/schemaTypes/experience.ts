import { defineField, defineType } from "sanity"

export default defineType({
  name: "experience",
  title: "Experience",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Job Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "company",
      title: "Company",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "url",
      title: "Company URL",
      type: "url",
      description: "Optional link to the company website",
    }),
    defineField({
      name: "startDate",
      title: "Start Date",
      type: "date",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "endDate",
      title: "End Date",
      type: "date",
      description: "Leave empty if this is your current position",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 4,
      validation: (rule) => rule.required(),
    }),
  ],
  orderings: [
    {
      title: "Start Date (Newest First)",
      name: "startDateDesc",
      by: [{ field: "startDate", direction: "desc" }],
    },
    {
      title: "Start Date (Oldest First)",
      name: "startDateAsc",
      by: [{ field: "startDate", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      company: "company",
      startDate: "startDate",
      endDate: "endDate",
    },
    prepare(selection) {
      const { title, company, startDate, endDate } = selection
      const startYear = startDate ? new Date(startDate).getFullYear() : ""
      const endYear = endDate ? new Date(endDate).getFullYear() : "Present"
      return {
        title,
        subtitle: `${company} • ${startYear} - ${endYear}`,
      }
    },
  },
})
