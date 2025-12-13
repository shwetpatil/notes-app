import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "./Card";

const meta = {
  title: "Components/Card",
  component: Card,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    children: {
      control: "text",
      description: "The content to display inside the card",
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div>
        <h3 className="mb-2 text-lg font-semibold">Card Title</h3>
        <p className="text-gray-600">
          This is a simple card component with some content inside.
        </p>
      </div>
    ),
  },
};

export const WithButton: Story = {
  args: {
    children: (
      <div>
        <h3 className="mb-2 text-lg font-semibold">Card with Action</h3>
        <p className="mb-4 text-gray-600">
          This card contains a button for user interaction.
        </p>
        <button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Click Me
        </button>
      </div>
    ),
  },
};

export const WithList: Story = {
  args: {
    children: (
      <div>
        <h3 className="mb-2 text-lg font-semibold">Features</h3>
        <ul className="list-inside list-disc space-y-1 text-gray-600">
          <li>Feature one</li>
          <li>Feature two</li>
          <li>Feature three</li>
        </ul>
      </div>
    ),
  },
};

export const CustomStyling: Story = {
  args: {
    className: "bg-blue-50 border-blue-300 max-w-md",
    children: (
      <div>
        <h3 className="mb-2 text-lg font-semibold text-blue-900">Custom Card</h3>
        <p className="text-blue-700">
          This card has custom styling applied through the className prop.
        </p>
      </div>
    ),
  },
};
