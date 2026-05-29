import contactRepo from '../repository/contact.repo.js'

const contactService = {
  async getAll() {
    return contactRepo.findAll()
  },

  async getById(id) {
    const contact = await contactRepo.findById(id)
    if (!contact) throw new Error('Contact not found')
    return contact
  },

  async create(data) {
    return contactRepo.create(data)
  },

  async update(id, data) {
    await contactService.getById(id)
    return contactRepo.update(id, data)
  },

  async delete(id) {
    await contactService.getById(id)
    return contactRepo.delete(id)
  }
}

export default contactService
