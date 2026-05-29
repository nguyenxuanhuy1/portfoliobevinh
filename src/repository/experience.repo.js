import prisma from '../config/prisma.js'

const experienceRepo = {
  findAll() {
    return prisma.experience.findMany({
      orderBy: { createdAt: 'desc' }
    })
  },

  findById(id) {
    return prisma.experience.findUnique({
      where: { id }
    })
  },

  create(data) {
    const { name, description, startDate, endDate } = data
    return prisma.experience.create({
      data: { name, description, startDate, endDate }
    })
  },

  update(id, data) {
    const { name, description, startDate, endDate } = data
    return prisma.experience.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(startDate !== undefined && { startDate }),
        ...(endDate !== undefined && { endDate })
      }
    })
  },

  delete(id) {
    return prisma.experience.delete({
      where: { id }
    })
  }
}

export default experienceRepo
