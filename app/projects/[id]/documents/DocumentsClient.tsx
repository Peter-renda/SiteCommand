"use client";

import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import ProjectNav from "@/components/ProjectNav";

type DocItem = {
  id: string;
  name: string;
  type: "file" | "folder";
  size: number | null;
  mime_type: string | null;
  url: string | null;
  created_at: string;
  parent_id: string | null;
};

type BreadcrumbItem = { id: string | null; name: string };

type FolderOption = { id: string | null; name: string; depth: number };

type FolderNode = {
  id: string;
  name: string;
  parent_id: string | null;
  children: FolderNode[];
};

function formatSize(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return "—";
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDate(ts: string): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getFileIcon(item: DocItem): React.ReactElement {
  if (item.type === "folder") {
    return (
      <svg className="w-4 h-4 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
      </svg>
    );
  }

  const mime = item.mime_type ?? "";
  const name = item.name.toLowerCase();

  if (mime === "application/pdf" || name.endsWith(".pdf")) {
    return (
      <svg className="w-4 h-4 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    );
  }

  if (
    mime.startsWith("image/") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".gif") ||
    name.endsWith(".webp") ||
    name.endsWith(".svg")
  ) {
    return (
      <svg className="w-4 h-4 text-blue-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
      </svg>
    );
  }

  if (
    mime.includes("spreadsheet") ||
    mime.includes("excel") ||
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    name.endsWith(".csv")
  ) {
    return (
      <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd" />
      </svg>
    );
  }

  return (
    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
    </svg>
  );
}

function buildFolderTree(
  folders: { id: string; name: string; parent_id: string | null }[],
  parentId: string | null,
  depth: number
): FolderOption[] {
  const result: FolderOption[] = [];
  const children = folders.filter((f) => f.parent_id === parentId);
  for (const child of children) {
    result.push({ id: child.id, name: child.name, depth });
    result.push(...buildFolderTree(folders, child.id, depth + 1));
  }
  return result;
}

function buildFolderNodes(
  folders: { id: string; name: string; parent_id: string | null }[],
  parentId: string | null
): FolderNode[] {
  return folders
    .filter((f) => f.parent_id === parentId)
    .map((f) => ({
      id: f.id,
      name: f.name,
      parent_id: f.parent_id,
      children: buildFolderNodes(folders, f.id),
    }));
}

function buildFolderPath(
  folders: { id: string; name: string; parent_id: string | null }[],
  folderId: string
): BreadcrumbItem[] {
  const path: BreadcrumbItem[] = [];
  let current: { id: string; name: string; parent_id: string | null } | undefined = folders.find(
    (f) => f.id === folderId
  );
  while (current) {
    path.unshift({ id: current.id, name: current.name });
    const parentId = current.parent_id;
    current = parentId ? folders.find((f) => f.id === parentId) : undefined;
  }
  return [{ id: null, name: "Documents" }, ...path];
}

function getAllDescendantIds(
  folders: { id: string; name: string; parent_id: string | null }[],
  ids: string[]
): Set<string> {
  const result = new Set<string>(ids);
  function collect(id: string) {
    for (const f of folders) {
      if (f.parent_id === id && !result.has(f.id)) {
        result.add(f.id);
        collect(f.id);
      }
    }
  }
  for (const id of ids) collect(id);
  return result;
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function InputModal({
  title,
  placeholder,
  defaultValue,
  onConfirm,
  onCancel,
}: {
  title: string;
  placeholder: string;
  defaultValue: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim()) onConfirm(value.trim());
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-xl p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">{title}</h2>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 mb-4"
          />
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!value.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MoveModal({
  folders,
  excludeIds,
  onConfirm,
  onCancel,
}: {
  folders: { id: string; name: string; parent_id: string | null }[];
  excludeIds: string[];
  onConfirm: (targetParentId: string | null) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [hasSelected, setHasSelected] = useState(false);

  const excludedIds = getAllDescendantIds(folders, excludeIds);
  const filteredFolders = folders.filter((f) => !excludedIds.has(f.id));
  const tree = buildFolderTree(filteredFolders, null, 0);

  function handleSelect(id: string | null) {
    setSelected(id);
    setHasSelected(true);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Move To</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto py-2">
          <button
            onClick={() => handleSelect(null)}
            className={`w-full text-left px-5 py-2 text-sm transition-colors flex items-center gap-2 ${
              hasSelected && selected === null
                ? "bg-gray-100 text-gray-900 font-medium"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <svg className="w-4 h-4 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
            Documents (root)
          </button>

          {tree.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={`w-full text-left px-5 py-2 text-sm transition-colors flex items-center gap-2 ${
                hasSelected && selected === option.id
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              style={{ paddingLeft: `${20 + option.depth * 16}px` }}
            >
              <svg className="w-4 h-4 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
              {option.name}
            </button>
          ))}
        </div>

        <div className="flex gap-3 justify-end px-5 py-4 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => hasSelected && onConfirm(selected)}
            disabled={!hasSelected}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Move
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar folder tree ───────────────────────────────────────────────────────

function FolderTreeItem({
  node,
  currentFolderId,
  expandedIds,
  onToggle,
  onNavigate,
  depth,
}: {
  node: FolderNode;
  currentFolderId: string | null;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onNavigate: (id: string) => void;
  depth: number;
}) {
  const isExpanded = expandedIds.has(node.id);
  const isActive = currentFolderId === node.id;
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1 px-2 rounded-md cursor-pointer group transition-colors ${
          isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        {/* Expand/collapse toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
          className="w-4 h-4 flex items-center justify-center shrink-0 text-gray-400 hover:text-gray-600"
        >
          {hasChildren ? (
            <svg
              className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <span className="w-3 h-3" />
          )}
        </button>

        {/* Folder icon + name */}
        <button
          onClick={() => onNavigate(node.id)}
          className="flex items-center gap-1.5 flex-1 min-w-0 text-left text-xs font-medium"
        >
          <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
          <span className="truncate">{node.name}</span>
        </button>
      </div>

      {isExpanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <FolderTreeItem
              key={child.id}
              node={child}
              currentFolderId={currentFolderId}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onNavigate={onNavigate}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function DocumentsClient({
  projectId,
  role,
  username,
}: {
  projectId: string;
  role: string;
  username: string;
}) {
  const [items, setItems] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([{ id: null, name: "Documents" }]);
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [renameTarget, setRenameTarget] = useState<DocItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocItem | null>(null);
  const [moveTarget, setMoveTarget] = useState<DocItem | null>(null);
  const [allFolders, setAllFolders] = useState<{ id: string; name: string; parent_id: string | null }[]>([]);
  const [uploading, setUploading] = useState(false);

  // New state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute("webkitdirectory", "");
    }
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    function handleClick() {
      setOpenMenuId(null);
      setMenuPos(null);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    loadItems(null);
    loadAllFolders();
  }, [projectId]);

  // Auto-expand ancestors of the current folder in the sidebar
  useEffect(() => {
    if (!currentParentId || allFolders.length === 0) return;
    const ancestorIds = new Set<string>();
    let cur: { id: string; parent_id: string | null } | undefined = allFolders.find(
      (f) => f.id === currentParentId
    );
    while (cur?.parent_id) {
      ancestorIds.add(cur.parent_id);
      cur = allFolders.find((f) => f.id === cur!.parent_id);
    }
    if (currentParentId) ancestorIds.add(currentParentId);
    setExpandedFolderIds((prev) => new Set([...prev, ...ancestorIds]));
  }, [currentParentId, allFolders]);

  async function loadItems(parentId: string | null) {
    setLoading(true);
    setSelectedIds(new Set());
    try {
      const url =
        parentId !== null
          ? `/api/projects/${projectId}/documents?parent_id=${parentId}`
          : `/api/projects/${projectId}/documents`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadAllFolders() {
    const res = await fetch(`/api/projects/${projectId}/documents?all_folders=true`);
    if (res.ok) {
      const data = await res.json();
      setAllFolders(Array.isArray(data) ? data : []);
    }
  }

  function openFolder(folder: DocItem) {
    setBreadcrumb((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setCurrentParentId(folder.id);
    loadItems(folder.id);
  }

  function navigateToBreadcrumb(index: number) {
    const crumb = breadcrumb[index];
    setBreadcrumb((prev) => prev.slice(0, index + 1));
    setCurrentParentId(crumb.id);
    loadItems(crumb.id);
  }

  function navigateToFolderById(folderId: string) {
    const path = buildFolderPath(allFolders, folderId);
    setBreadcrumb(path);
    setCurrentParentId(folderId);
    loadItems(folderId);
  }

  function handleSidebarNavigateRoot() {
    setBreadcrumb([{ id: null, name: "Documents" }]);
    setCurrentParentId(null);
    loadItems(null);
  }

  function toggleFolderExpand(id: string) {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("parent_id", currentParentId ?? "null");
      await fetch(`/api/projects/${projectId}/documents`, {
        method: "POST",
        body: formData,
      });
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    await loadItems(currentParentId);
    await loadAllFolders();
  }

  async function handleFolderUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);

    const fileArray = Array.from(files) as (File & { webkitRelativePath: string })[];
    const folderPathSet = new Set<string>();
    for (const file of fileArray) {
      const parts = file.webkitRelativePath.split("/");
      for (let i = 1; i < parts.length; i++) {
        folderPathSet.add(parts.slice(0, i).join("/"));
      }
    }

    const folderPaths = Array.from(folderPathSet).sort(
      (a, b) => a.split("/").length - b.split("/").length
    );
    const pathToId = new Map<string, string>();

    for (const folderPath of folderPaths) {
      const parts = folderPath.split("/");
      const name = parts[parts.length - 1];
      const parentPath = parts.slice(0, -1).join("/");
      const parentId = parentPath ? (pathToId.get(parentPath) ?? currentParentId) : currentParentId;

      const res = await fetch(`/api/projects/${projectId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parent_id: parentId }),
      });
      if (res.ok) {
        const data = await res.json();
        pathToId.set(folderPath, data.id);
      }
    }

    for (const file of fileArray) {
      const parts = file.webkitRelativePath.split("/");
      const parentPath = parts.slice(0, -1).join("/");
      const parentId = parentPath ? (pathToId.get(parentPath) ?? currentParentId) : currentParentId;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("parent_id", parentId ?? "null");
      await fetch(`/api/projects/${projectId}/documents`, {
        method: "POST",
        body: formData,
      });
    }

    setUploading(false);
    if (folderInputRef.current) folderInputRef.current.value = "";
    await loadItems(currentParentId);
    await loadAllFolders();
  }

  async function handleCreateFolder(name: string) {
    setShowNewFolder(false);
    await fetch(`/api/projects/${projectId}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parent_id: currentParentId }),
    });
    await loadItems(currentParentId);
    await loadAllFolders();
  }

  async function handleRename(name: string) {
    if (!renameTarget) return;
    setRenameTarget(null);
    const res = await fetch(`/api/projects/${projectId}/documents/${renameTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      setItems((prev) =>
        prev.map((item) => (item.id === renameTarget.id ? { ...item, name } : item))
      );
      await loadAllFolders();
    }
  }

  async function handleMove(targetParentId: string | null) {
    if (!moveTarget) return;
    setMoveTarget(null);
    await fetch(`/api/projects/${projectId}/documents/${moveTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parent_id: targetParentId }),
    });
    setItems((prev) => prev.filter((item) => item.id !== moveTarget.id));
    await loadAllFolders();
  }

  async function handleCopy(item: DocItem) {
    setOpenMenuId(null);
    await fetch(`/api/projects/${projectId}/documents/${item.id}/copy`, {
      method: "POST",
    });
    await loadItems(currentParentId);
    await loadAllFolders();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    await fetch(`/api/projects/${projectId}/documents/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((item) => item.id !== id));
    await loadAllFolders();
  }

  async function handleDownload(item: DocItem) {
    if (item.type === "file") {
      if (!item.url) return;
      const a = document.createElement("a");
      a.href = item.url;
      a.download = item.name;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const res = await fetch(`/api/projects/${projectId}/documents/${item.id}/files`);
      if (!res.ok) return;
      const files: { name: string; url: string }[] = await res.json();
      for (let i = 0; i < files.length; i++) {
        await new Promise<void>((resolve) => setTimeout(() => resolve(), i === 0 ? 0 : 500));
        const a = document.createElement("a");
        a.href = files[i].url;
        a.download = files[i].name;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    }
  }

  async function handleEmail(item: DocItem) {
    if (item.type === "file") {
      const subject = encodeURIComponent(`Sharing: ${item.name}`);
      const body = encodeURIComponent(`Download link: ${item.url}`);
      window.open(`mailto:?subject=${subject}&body=${body}`);
    } else {
      const res = await fetch(`/api/projects/${projectId}/documents/${item.id}/files`);
      if (!res.ok) return;
      const files: { name: string; url: string }[] = await res.json();
      const subject = encodeURIComponent(`Sharing: ${item.name}`);
      const bodyText = files.map((f) => `${f.name}: ${f.url}`).join("\n");
      const body = encodeURIComponent(`Files from ${item.name}:\n\n${bodyText}`);
      window.open(`mailto:?subject=${subject}&body=${body}`);
    }
  }

  async function openMoveModal(item: DocItem) {
    setOpenMenuId(null);
    await loadAllFolders();
    setMoveTarget(item);
  }

  // ─── Bulk operations ─────────────────────────────────────────────────────────

  async function handleBulkDelete() {
    setBulkDeleteOpen(false);
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await fetch(`/api/projects/${projectId}/documents/${id}`, { method: "DELETE" });
    }
    setSelectedIds(new Set());
    await loadItems(currentParentId);
    await loadAllFolders();
  }

  async function handleBulkMove(targetParentId: string | null) {
    setBulkMoveOpen(false);
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await fetch(`/api/projects/${projectId}/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parent_id: targetParentId }),
      });
    }
    setSelectedIds(new Set());
    await loadItems(currentParentId);
    await loadAllFolders();
  }

  async function handleBulkCopy() {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await fetch(`/api/projects/${projectId}/documents/${id}/copy`, { method: "POST" });
    }
    setSelectedIds(new Set());
    await loadItems(currentParentId);
    await loadAllFolders();
  }

  async function handleBulkDownload() {
    const selected = items.filter((item) => selectedIds.has(item.id));
    let delay = 0;
    for (const item of selected) {
      if (item.type === "file") {
        if (!item.url) continue;
        await new Promise<void>((resolve) => setTimeout(() => resolve(), delay));
        delay += 500;
        const a = document.createElement("a");
        a.href = item.url;
        a.download = item.name;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const res = await fetch(`/api/projects/${projectId}/documents/${item.id}/files`);
        if (!res.ok) continue;
        const files: { name: string; url: string }[] = await res.json();
        for (const f of files) {
          await new Promise<void>((resolve) => setTimeout(() => resolve(), delay));
          delay += 500;
          const a = document.createElement("a");
          a.href = f.url;
          a.download = f.name;
          a.target = "_blank";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      }
    }
  }

  async function handleBulkEmail() {
    const selected = items.filter((item) => selectedIds.has(item.id));
    const allFiles: { name: string; url: string }[] = [];

    for (const item of selected) {
      if (item.type === "file") {
        if (item.url) allFiles.push({ name: item.name, url: item.url });
      } else {
        const res = await fetch(`/api/projects/${projectId}/documents/${item.id}/files`);
        if (res.ok) {
          const files: { name: string; url: string }[] = await res.json();
          allFiles.push(...files);
        }
      }
    }

    const subject = encodeURIComponent(`Sharing ${allFiles.length} file${allFiles.length !== 1 ? "s" : ""}`);
    const bodyText = allFiles.map((f) => `${f.name}: ${f.url}`).join("\n");
    const body = encodeURIComponent(`Files:\n\n${bodyText}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }

  // ─── Selection helpers ────────────────────────────────────────────────────────

  const filteredItems = searchQuery
    ? items.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : items;

  const allSelected = filteredItems.length > 0 && filteredItems.every((item) => selectedIds.has(item.id));
  const someSelected = selectedIds.size > 0;

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((i) => i.id)));
    }
  }

  function toggleSelectItem(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  const folderTree = buildFolderNodes(allFolders, null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
        <a href="/dashboard" className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors">
          SiteCommand
        </a>
        <div className="flex items-center gap-5">
          {role === "admin" && (
            <a href="/admin" className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors">
              Admin
            </a>
          )}
          <span className="text-sm text-gray-400">{username}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-gray-900 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <ProjectNav projectId={projectId} />

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} />
      <input ref={folderInputRef} type="file" className="hidden" onChange={handleFolderUpload} />

      <div className="flex" style={{ minHeight: "calc(100vh - 112px)" }}>
        {/* ── Left sidebar: folder tree ── */}
        <aside className="w-56 shrink-0 bg-white border-r border-gray-100 px-3 py-4 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
            Folders
          </p>

          {/* Root */}
          <button
            onClick={handleSidebarNavigateRoot}
            className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors mb-0.5 ${
              currentParentId === null
                ? "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
            Documents
          </button>

          {/* Folder tree */}
          {folderTree.map((node) => (
            <FolderTreeItem
              key={node.id}
              node={node}
              currentFolderId={currentParentId}
              expandedIds={expandedFolderIds}
              onToggle={toggleFolderExpand}
              onNavigate={navigateToFolderById}
              depth={0}
            />
          ))}
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 px-6 py-6">
          {/* Search + Add button row */}
          <div className="flex items-center gap-3 mb-5">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search files and folders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Add dropdown */}
            <div ref={addMenuRef} className="relative ml-auto">
              <button
                onClick={() => setShowAddMenu((o) => !o)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add
                <svg
                  className={`w-4 h-4 transition-transform ${showAddMenu ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showAddMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-20">
                  <button
                    onClick={() => { fileInputRef.current?.click(); setShowAddMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Upload Files
                  </button>
                  <button
                    onClick={() => { folderInputRef.current?.click(); setShowAddMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Upload Folder
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={() => { setShowNewFolder(true); setShowAddMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    New Folder
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 mb-4">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-gray-300 text-xs">/</span>}
                <button
                  onClick={() => navigateToBreadcrumb(i)}
                  className={`text-xs hover:text-gray-900 transition-colors ${
                    i === breadcrumb.length - 1 ? "text-gray-700 font-medium" : "text-gray-400"
                  }`}
                >
                  {crumb.name}
                </button>
              </span>
            ))}
          </nav>

          {/* Bulk action bar */}
          {someSelected && (
            <div className="flex items-center gap-2 mb-4 px-4 py-2.5 bg-gray-900 text-white rounded-xl">
              <span className="text-xs font-medium mr-1">
                {selectedIds.size} selected
              </span>
              <div className="w-px h-4 bg-white/20 mx-1" />

              <button
                onClick={handleBulkDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 rounded-md transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>

              <button
                onClick={handleBulkEmail}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 rounded-md transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
              </button>

              <button
                onClick={async () => { await loadAllFolders(); setBulkMoveOpen(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 rounded-md transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Move
              </button>

              <button
                onClick={handleBulkCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 rounded-md transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </button>

              <button
                onClick={() => setBulkDeleteOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-500/80 hover:bg-red-500 rounded-md transition-colors ml-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>

              <button
                onClick={() => setSelectedIds(new Set())}
                className="ml-auto text-xs text-white/60 hover:text-white transition-colors"
              >
                Clear
              </button>
            </div>
          )}

          {/* Uploading indicator */}
          {uploading && (
            <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
              Uploading files...
            </div>
          )}

          {/* File list */}
          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : filteredItems.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-xl py-16 text-center">
              <svg
                className="w-10 h-10 text-gray-200 mx-auto mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
                />
              </svg>
              {searchQuery ? (
                <p className="text-sm text-gray-400">No results for &ldquo;{searchQuery}&rdquo;</p>
              ) : (
                <>
                  <p className="text-sm text-gray-400">No files or folders yet</p>
                  <p className="text-xs text-gray-300 mt-1">Use the Add button to upload files or create a folder</p>
                </>
              )}
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                      />
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 w-32"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const isSelected = selectedIds.has(item.id);
                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-gray-50 transition-colors last:border-b-0 ${
                          isSelected ? "bg-gray-50" : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="px-4 py-3 w-10">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectItem(item.id)}
                            className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() =>
                              item.type === "folder" ? openFolder(item) : handleDownload(item)
                            }
                            className="flex items-center gap-2.5 text-sm text-gray-900 hover:text-gray-600 transition-colors text-left"
                          >
                            {getFileIcon(item)}
                            <span className="truncate max-w-xs">{item.name}</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {item.type === "folder" ? "—" : formatSize(item.size)}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {formatDate(item.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-0.5">
                            <button
                              onClick={() => handleDownload(item)}
                              title="Download"
                              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </button>

                            <button
                              onClick={() => handleEmail(item)}
                              title="Email"
                              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </button>

                            <button
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (openMenuId === item.id) {
                                  setOpenMenuId(null);
                                  setMenuPos(null);
                                } else {
                                  const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                                  setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                                  setOpenMenuId(item.id);
                                }
                              }}
                              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <circle cx="5" cy="12" r="1.5" />
                                <circle cx="12" cy="12" r="1.5" />
                                <circle cx="19" cy="12" r="1.5" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {showNewFolder && (
        <InputModal
          title="New Folder"
          placeholder="Folder name"
          defaultValue=""
          onConfirm={handleCreateFolder}
          onCancel={() => setShowNewFolder(false)}
        />
      )}
      {renameTarget && (
        <InputModal
          title="Rename"
          placeholder="New name"
          defaultValue={renameTarget.name}
          onConfirm={handleRename}
          onCancel={() => setRenameTarget(null)}
        />
      )}
      {deleteTarget && (
        <ConfirmModal
          title="Delete"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This will permanently delete all contents.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {bulkDeleteOpen && (
        <ConfirmModal
          title="Delete Selected"
          message={`Are you sure you want to delete ${selectedIds.size} item${selectedIds.size !== 1 ? "s" : ""}? This will permanently delete all contents.`}
          onConfirm={handleBulkDelete}
          onCancel={() => setBulkDeleteOpen(false)}
        />
      )}
      {moveTarget && (
        <MoveModal
          folders={allFolders}
          excludeIds={[moveTarget.id]}
          onConfirm={handleMove}
          onCancel={() => setMoveTarget(null)}
        />
      )}
      {bulkMoveOpen && (
        <MoveModal
          folders={allFolders}
          excludeIds={Array.from(selectedIds)}
          onConfirm={handleBulkMove}
          onCancel={() => setBulkMoveOpen(false)}
        />
      )}

      {/* Fixed-position three-dot dropdown */}
      {openMenuId && menuPos && (() => {
        const item = items.find((i) => i.id === openMenuId);
        if (!item) return null;
        return (
          <div
            onMouseDown={(e) => e.stopPropagation()}
            style={{ position: "fixed", top: menuPos.top, right: menuPos.right, zIndex: 9999 }}
            className="w-44 bg-white border border-gray-100 rounded-lg shadow-lg py-1"
          >
            <button
              onClick={() => { setRenameTarget(item); setOpenMenuId(null); setMenuPos(null); }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Rename
            </button>
            <button
              onClick={() => openMoveModal(item)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Move
            </button>
            <button
              onClick={() => handleCopy(item)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Copy
            </button>
            <div className="border-t border-gray-100 my-1" />
            <button
              onClick={() => { setDeleteTarget(item); setOpenMenuId(null); setMenuPos(null); }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </div>
        );
      })()}
    </div>
  );
}
