"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { templatesApi } from "@/lib/api";
import { Button, Input } from "@notes/ui-lib";
import { RichTextEditor } from "./RichTextEditor";
import type { Template, CreateTemplateInput } from "@notes/types";

export function TemplateManager() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<CreateTemplateInput>({
    name: "",
    description: "",
    content: "",
    contentFormat: "plaintext",
    tags: [],
    color: undefined,
  });
  const [tagInput, setTagInput] = useState("");

  const queryClient = useQueryClient();

  const { data: templatesData, isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: () => templatesApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: templatesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      templatesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: templatesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      content: "",
      contentFormat: "plaintext",
      tags: [],
      color: undefined,
    });
    setTagInput("");
    setIsCreating(false);
    setEditingTemplate(null);
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      content: template.content,
      contentFormat: template.contentFormat,
      tags: template.tags,
      color: template.color,
    });
    setIsCreating(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;

    if (editingTemplate) {
      updateMutation.mutate({
        id: editingTemplate.id,
        data: formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const templates = templatesData?.data || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Template List */}
      <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Button
            onClick={() => setIsCreating(true)}
            variant="primary"
            className="w-full"
          >
            + New Template
          </Button>
        </div>

        {templates.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No templates yet. Create your first template to get started!
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {templates.map((template) => (
              <div
                key={template.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                onClick={() => handleEdit(template)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {template.name}
                    </h3>
                    {template.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {template.description}
                      </p>
                    )}
                    {template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {template.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-block px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(template.id);
                    }}
                    className="ml-2 text-red-600 hover:text-red-700 dark:text-red-400"
                    title="Delete template"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Template Editor */}
      <div className="flex-1 overflow-y-auto">
        {isCreating ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {editingTemplate ? "Edit Template" : "Create Template"}
              </h2>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={resetForm}
              >
                Cancel
              </Button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Template Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Meeting Notes, Daily Journal"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of this template..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Content Format
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={formData.contentFormat === "plaintext" ? "primary" : "secondary"}
                  onClick={() =>
                    setFormData({ ...formData, contentFormat: "plaintext" })
                  }
                >
                  Plain Text
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={formData.contentFormat === "markdown" ? "primary" : "secondary"}
                  onClick={() =>
                    setFormData({ ...formData, contentFormat: "markdown" })
                  }
                >
                  Markdown
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={formData.contentFormat === "html" ? "primary" : "secondary"}
                  onClick={() =>
                    setFormData({ ...formData, contentFormat: "html" })
                  }
                >
                  Rich Text
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Template Content
              </label>
              {formData.contentFormat === "html" ? (
                <RichTextEditor
                  content={formData.content}
                  onChange={(html) =>
                    setFormData({ ...formData, content: html })
                  }
                  placeholder="Template content..."
                />
              ) : (
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="Template content..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 font-mono"
                  rows={10}
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Default Tags
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add tags..."
                  className="flex-1"
                />
                <Button type="button" size="sm" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-blue-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Default Color
              </label>
              <div className="flex gap-2">
                {["bg-white", "bg-red-100", "bg-yellow-100", "bg-green-100", "bg-blue-100", "bg-purple-100"].map(
                  (colorClass) => (
                    <button
                      key={colorClass}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, color: colorClass })
                      }
                      className={`w-10 h-10 rounded-full border-2 ${colorClass} ${
                        formData.color === colorClass
                          ? "border-blue-500 ring-2 ring-blue-200"
                          : "border-gray-300"
                      }`}
                    />
                  )
                )}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, color: undefined })}
                  className={`w-10 h-10 rounded-full border-2 ${
                    !formData.color
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "border-gray-300"
                  }`}
                  title="No color"
                >
                  ∅
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={createMutation.isPending || updateMutation.isPending}
              >
                {editingTemplate ? "Update Template" : "Create Template"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <p className="text-lg mb-2">📝 Template Manager</p>
              <p className="text-sm">
                {templates.length === 0
                  ? "Create your first template to get started"
                  : "Select a template to edit or create a new one"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
