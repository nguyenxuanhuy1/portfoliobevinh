import adminProfileRepo from '../repository/adminProfile.repo.js'

const adminProfileService = {
  async get() {
    const profile = await adminProfileRepo.findOne()
    if (!profile) throw new Error('Admin profile not found')
    return profile
  },

  async create(data) {
    const existing = await adminProfileRepo.findOne()
    if (existing) throw new Error('Admin profile already exists')
    return adminProfileRepo.create(data)
  },

  async update(id, data) {
    await adminProfileService.get()
    return adminProfileRepo.update(id, data)
  }
}

export default adminProfileService
