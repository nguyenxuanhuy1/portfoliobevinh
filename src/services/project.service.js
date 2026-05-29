import projectRepo from '../repository/project.repo.js'

const projectService = {
  async getAll() {
    return projectRepo.findAll()
  },

  async getById(id) {
    const project = await projectRepo.findById(id)
    if (!project) throw new Error('Project not found')
    return project
  },

  async getByName(name) {
    const project = await projectRepo.findByName(name)
    if (!project) throw new Error('Project not found')
    return project
  },

  async create(data) {
    return projectRepo.create(data)
  },

  async update(id, data) {
    await projectService.getById(id)
    return projectRepo.update(id, data)
  },

  async delete(id) {
    await projectService.getById(id)
    return projectRepo.delete(id)
  }
}

export default projectService