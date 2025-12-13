import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./Input";

const meta = {
  title: "Components/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: "text",
      description: "Label text for the input field",
    },
    error: {
      control: "text",
      description: "Error message to display below the input",
    },
    disabled: {
      control: "boolean",
      description: "Disables the input when true",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text for the input",
    },
    type: {
      control: "select",
      options: ["text", "email", "password", "number"],
      description: "HTML input type",
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Enter text...",
  },
};

export const WithLabel: Story = {
  args: {
    label: "Email Address",
    placeholder: "you@example.com",
    type: "email",
  },
};

export const WithError: Story = {
  args: {
    label: "Username",
    placeholder: "Enter username",
    error: "This field is required",
  },
};

export const Disabled: Story = {
  args: {
    label: "Disabled Input",
    placeholder: "You can't edit this",
    disabled: true,
  },
};

export const Password: Story = {
  args: {
    label: "Password",
    type: "password",
    placeholder: "Enter your password",
  },
};

export const Number: Story = {
  args: {
    label: "Age",
    type: "number",
    placeholder: "Enter your age",
  },
};

export const CustomStyling: Story = {
  args: {
    label: "Custom Styled Input",
    placeholder: "Custom styling",
    className: "border-2 border-purple-500 focus:ring-purple-500",
  },
};
