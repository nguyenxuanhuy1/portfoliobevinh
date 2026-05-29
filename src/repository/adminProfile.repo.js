import prisma from '../config/prisma.js'

const adminProfileRepo = {
  findOne() {
    // Chỉ có 1 admin profile, lấy record đầu tiên
    return prisma.adminProfile.findFirst()
  },

  create(data) {
    const { name, position, bio, skills, workStatus } = data

    return prisma.adminProfile.create({
      data: {
        name,
        position,
        bio,
        skills,
        ...(workStatus && { workStatus })
      }
    })
  },

  update(id, data) {
    const { name, position, bio, skills, workStatus } = data

    return prisma.adminProfile.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(position !== undefined && { position }),
        ...(bio !== undefined && { bio }),
        ...(skills !== undefined && { skills }),
        ...(workStatus !== undefined && { workStatus })
      }
    })
  }
}

export default adminProfileRepo
