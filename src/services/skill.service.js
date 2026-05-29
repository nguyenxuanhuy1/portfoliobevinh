import skillRepo from '../repository/skill.repo.js'

const skillService = {
  async getAll() {
    return skillRepo.findAll()
  },

  async getById(id) {
    const skill = await skillRepo.findById(id)
    if (!skill) throw new Error('Skill not found')
    return skill
  },

  async create(data) {
    return skillRepo.create(data)
  },

  async update(id, data) {
    await skillService.getById(id)
    return skillRepo.update(id, data)
  },

  async delete(id) {
    await skillService.getById(id)
    return skillRepo.delete(id)
  }
}

export default skillService
