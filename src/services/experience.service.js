import experienceRepo from '../repository/experience.repo.js'

const experienceService = {
  async getAll() {
    return experienceRepo.findAll()
  },

  async getById(id) {
    const experience = await experienceRepo.findById(id)
    if (!experience) throw new Error('Experience not found')
    return experience
  },

  async create(data) {
    return experienceRepo.create(data)
  },

  async update(id, data) {
    await experienceService.getById(id)
    return experienceRepo.update(id, data)
  },

  async delete(id) {
    await experienceService.getById(id)
    return experienceRepo.delete(id)
  }
}

export default experienceService
