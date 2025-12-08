import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  useGetProjectQuery, 
  useCreateProjectMutation, 
  useUpdateProjectMutation 
} from '../../services/api' 
interface ProjectFormData {
  project_name: string
  description: string
  project_type: string
  priority: string
  status: string
  budget: number
  start_date: string
  target_end_date: string
  team_leader: string
  team_members: string
  research_objectives: string
  expected_outcomes: string
  milestones: string
  notes: string
}

export default function ProjectForm() {
    const { t } = useLanguage();

const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  
  const { data: project, isLoading } = useGetProjectQuery(id, { skip: !id })
  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation()
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProjectFormData>({
    defaultValues: {
      project_name: '',
      description: '',
      project_type: 'research',
      priority: 'medium',
      status: 'planning',
      budget: 0,
      start_date: '',
      target_end_date: '',
      team_leader: '',
      team_members: '',
      research_objectives: '',
      expected_outcomes: '',
      milestones: '',
      notes: ''
    }
  })

  useEffect(() => {
    if (project) {
      reset({
        project_name: project.project_name || '',
        description: project.description || '',
        project_type: project.project_type || 'research',
        priority: project.priority || 'medium',
        status: project.status || 'planning',
        budget: project.budget || 0,
        start_date: project.start_date ? project.start_date.split('T')[0] : '',
        target_end_date: project.target_end_date ? project.target_end_date.split('T')[0] : '',
        team_leader: project.team_leader || '',
        team_members: project.team_members || '',
        research_objectives: project.research_objectives || '',
        expected_outcomes: project.expected_outcomes || '',
        milestones: project.milestones || '',
        notes: project.notes || ''
      })
    }
  }, [project, reset])

  const onSubmit = async (data: ProjectFormData) => {
    try {
      if (isEdit && id) {
        await updateProject({ id, ...data }).unwrap()
        toast.success('R&D Project updated successfully!')
      } else {
        await createProject(data).unwrap()
        toast.success('R&D Project created successfully!')
      }
      navigate('/app/rd/projects')
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to save R&D project')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEdit ? 'Edit R&D Project' : 'New R&D Project'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {isEdit ? 'Update project information' : 'Create a new research and development project'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                {...register('project_name', { required: 'Project name is required' })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.project_name && (
                <p className="text-red-500 text-sm mt-1">{errors.project_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Project Type
              </label>
              <select
                {...register('project_type')}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="research">Research</option>
                <option value="development">Development</option>
                <option value="innovation">Innovation</option>
                <option value="improvement">Process Improvement</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              </label>
              <select
                {...register('priority')}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('common.status')}</label>
              <select
                {...register('status')}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Budget (Rp)
              </label>
              <input
                type="number"
                step="0.01"
                {...register('budget', { valueAsNumber: true })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('common.description')}</label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Timeline</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                {...register('start_date')}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target End Date
              </label>
              <input
                type="date"
                {...register('target_end_date')}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              </label>
              <textarea
                {...register('milestones')}
                rows={3}
                placeholder="List key milestones and deadlines..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Team Assignment */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Team Assignment</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Team Leader
              </label>
              <input
                type="text"
                {...register('team_leader')}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Team Members
              </label>
              <textarea
                {...register('team_members')}
                rows={2}
                placeholder="List team members separated by commas..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Research Objectives */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Research Objectives</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Research Objectives
              </label>
              <textarea
                {...register('research_objectives')}
                rows={4}
                placeholder="Describe the main research objectives and goals..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expected Outcomes
              </label>
              <textarea
                {...register('expected_outcomes')}
                rows={4}
                placeholder="Describe expected outcomes and deliverables..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                placeholder="Additional notes and comments..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/app/rd/projects')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >{t('common.cancel')}</button>
          <button
            type="submit"
            disabled={isCreating || isUpdating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating || isUpdating ? 'Saving...' : (isEdit ? 'Update Project' : 'Create Project')}
          </button>
        </div>
      </form>
    </div>
  )
}
