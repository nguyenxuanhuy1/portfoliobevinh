import prisma from '../config/prisma.js'

const skillRepo = {
  findAll() {
    return prisma.skill.findMany({
      orderBy: { createdAt: 'desc' }
    })
  },

  findById(id) {
    return prisma.skill.findUnique({
      where: { id }
    })
  },

  create(data) {
    const { name, image } = data
    return prisma.skill.create({
      data: { name, image }
    })
  },

  update(id, data) {
    const { name, image } = data
    return prisma.skill.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(image !== undefined && { image })
      }
    })
  },

  delete(id) {
    return prisma.skill.delete({
      where: { id }
    })
  }
}

export default skillRepo
