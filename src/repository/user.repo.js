import prisma from '../config/prisma.js'

const userRepo = {
  findAll() {
    return prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
  },

  findById(id) {
    return prisma.user.findUnique({
      where: {
        id
      }
    })
  },

  findByEmail(email) {
    return prisma.user.findUnique({
      where: {
        email
      }
    })
  },

  create(data) {
    return prisma.user.create({
      data
    })
  },

  delete(id) {
    return prisma.user.delete({
      where: {
        id
      }
    })
  }
}

export default userRepo