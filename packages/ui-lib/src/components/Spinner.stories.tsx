import type { Meta, StoryObj } from "@storybook/react";
import { Spinner } from "./Spinner";

const meta = {
  title: "Components/Spinner",
  component: Spinner,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "The size of the spinner",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Small: Story = {
  args: {
    size: "sm",
  },
};

export const Medium: Story = {
  args: {
    size: "md",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
  },
};

export const CustomColor: Story = {
  args: {
    size: "md",
    className: "text-blue-600",
  },
};

export const InButton: Story = {
  render: () => (
    <button className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white">
      <Spinner size="sm" className="mr-2" />
      Loading...
    </button>
  ),
};

export const InCard: Story = {
  render: () => (
    <div className="flex h-32 w-64 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-2 text-blue-600" />
        <p className="text-sm text-gray-600">Loading content...</p>
      </div>
    </div>
  ),
};
