'use client';

import { useState } from 'react';
import { Database, Download, Eye, EyeOff, Trash2 } from 'lucide-react';
import { mockProjects } from '../mocks';
import type { Project } from '../types';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmationModal
} from './workspace-ui';

export function ProjectManagementSection() {
  const [projects] = useState<Project[]>(mockProjects);
  const [showConfirmModal, setShowConfirmModal] = useState<{
    isOpen: boolean;
    type: 'archive' | 'delete' | null;
    project: Project | null;
  }>({ isOpen: false, type: null, project: null });

  const handleProjectAction = (action: string, project: Project) => {
    setShowConfirmModal({
      isOpen: true,
      type: action as 'archive' | 'delete',
      project
    });
  };

  const confirmProjectAction = () => {
    const { type, project } = showConfirmModal;
    console.log(`${type} action for project:`, project);
    setShowConfirmModal({ isOpen: false, type: null, project: null });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">Total Projects: {projects.length}</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium text-gray-700">Project</th>
                  <th className="text-left p-2 font-medium text-gray-700">Visibility</th>
                  <th className="text-left p-2 font-medium text-gray-700">Status</th>
                  <th className="text-left p-2 font-medium text-gray-700">Members</th>
                  <th className="text-left p-2 font-medium text-gray-700">Created</th>
                  <th className="text-left p-2 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{project.projectName}</div>
                        <div className="text-sm text-gray-500">/{project.slug}</div>
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge variant={project.isPublic ? 'success' : 'default'}>
                        {project.isPublic ? (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            Public
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3 mr-1" />
                            Private
                          </>
                        )}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <Badge variant={project.isActive ? 'success' : 'default'}>
                        {project.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-2 text-sm text-gray-600">{project.memberCount} members</td>
                    <td className="p-2 text-sm text-gray-600">{new Date(project.createdAt).toLocaleDateString()}</td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleProjectAction('archive', project)}>
                          <Database className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleProjectAction('delete', project)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>

      <ConfirmationModal
        isOpen={showConfirmModal.isOpen}
        onClose={() => setShowConfirmModal({ isOpen: false, type: null, project: null })}
        onConfirm={confirmProjectAction}
        title={`${showConfirmModal.type?.charAt(0).toUpperCase()}${showConfirmModal.type?.slice(1)} Project`}
        description={`Are you sure you want to ${showConfirmModal.type} "${showConfirmModal.project?.projectName}"?`}
        isDestructive={showConfirmModal.type === 'delete'}
      />
    </Card>
  );
}
