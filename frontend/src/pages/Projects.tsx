import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  createProject,
  getClients,
  getProjects,
} from "../api/project.api";
import type { Project, Client } from "../api/project.api";
import { useAuth } from "../context/AuthContext";

export default function Projects() {
  const { user } = useAuth();

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [clients, setClients] =
    useState<Client[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [showForm, setShowForm] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [name, setName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [clientId, setClientId] =
    useState("");

  const isAdmin = user?.role === "ADMIN";

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [projectsData, clientsData] =
        await Promise.all([
          getProjects(),
          getClients(),
        ]);

      setProjects(projectsData);
      setClients(clientsData);
    } catch (error: any) {
      setError(
        error?.response?.data?.message ||
          "Unable to load projects"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateProject(
    event: FormEvent
  ) {
    event.preventDefault();

    if (!name.trim() || !clientId) {
      setError(
        "Project name and client are required"
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      await createProject({
        name: name.trim(),
        description:
          description.trim() || undefined,
        clientId,

        // PM creates their own project.
        // Admin handling will be improved below.
        ...(isAdmin
          ? {}
          : { managerId: user?.id }),
      });

      setName("");
      setDescription("");
      setClientId("");
      setShowForm(false);

      await loadData();
    } catch (error: any) {
      setError(
        error?.response?.data?.message ||
          "Unable to create project"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page-card">
        <div className="loading-state">
          Loading projects...
        </div>
      </div>
    );
  }

  return (
    <div className="projects-page">

      <div className="projects-header">
        <div>
          <h1>Projects</h1>

          <p>
            {isAdmin
              ? "Manage all client projects"
              : "Manage projects assigned to you"}
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() =>
            setShowForm(!showForm)
          }
        >
          {showForm
            ? "Cancel"
            : "+ New Project"}
        </button>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {showForm && (
        <div className="project-form-card">
          <h2>Create Project</h2>

          <form
            onSubmit={handleCreateProject}
            className="project-form"
          >
            <div className="form-group">
              <label>
                Project Name
              </label>

              <input
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Enter project name"
                required
              />
            </div>

            <div className="form-group">
              <label>
                Description
              </label>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                placeholder="Describe the project"
                rows={4}
              />
            </div>

            <div className="form-group">
              <label>
                Client
              </label>

              <select
                value={clientId}
                onChange={(event) =>
                  setClientId(
                    event.target.value
                  )
                }
                required
              >
                <option value="">
                  Select client
                </option>

                {clients.map((client) => (
                  <option
                    key={client.id}
                    value={client.id}
                  >
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving
                ? "Creating..."
                : "Create Project"}
            </button>
          </form>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            📁
          </div>

          <h3>No projects found</h3>

          <p>
            Create your first project to get
            started.
          </p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <div
              className="project-card"
              key={project.id}
            >
              <div className="project-card-top">
                <div className="project-icon">
                  📁
                </div>

                <span className="project-status">
                  Active
                </span>
              </div>

              <h2>{project.name}</h2>

              <p className="project-description">
                {project.description ||
                  "No description provided."}
              </p>

              <div className="project-details">

                <div>
                  <span>Client</span>
                  <strong>
                    {project.client?.name ||
                      "Unknown"}
                  </strong>
                </div>

                <div>
                  <span>Project Manager</span>
                  <strong>
                    {project.manager?.name ||
                      "Unknown"}
                  </strong>
                </div>

                <div>
                  <span>Tasks</span>
                  <strong>
                    {project._count?.tasks ??
                      0}
                  </strong>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}