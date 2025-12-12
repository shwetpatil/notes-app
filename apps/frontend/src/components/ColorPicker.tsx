"use client";

interface ColorPickerProps {
  value?: string;
  onChange: (color: string | undefined) => void;
}

const COLORS = [
  { name: "None", value: undefined, class: "bg-white border-2 border-gray-300" },
  { name: "Red", value: "#fee2e2", class: "bg-red-100" },
  { name: "Orange", value: "#fed7aa", class: "bg-orange-100" },
  { name: "Yellow", value: "#fef3c7", class: "bg-yellow-100" },
  { name: "Green", value: "#dcfce7", class: "bg-green-100" },
  { name: "Blue", value: "#dbeafe", class: "bg-blue-100" },
  { name: "Purple", value: "#e9d5ff", class: "bg-purple-100" },
  { name: "Pink", value: "#fce7f3", class: "bg-pink-100" },
];

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex gap-2">
      {COLORS.map((color) => (
        <button
          key={color.name}
          type="button"
          onClick={() => onChange(color.value)}
          className={`h-6 w-6 rounded-full ${color.class} ${
            value === color.value ? "ring-2 ring-blue-500 ring-offset-2" : ""
          } hover:scale-110 transition-transform`}
          title={color.name}
        />
      ))}
    </div>
  );
}
