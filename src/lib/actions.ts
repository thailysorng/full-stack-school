"use server";

import { revalidatePath } from "next/cache";
import {
  ClassSchema,
  ExamSchema,
  StudentSchema,
  SubjectSchema,
  TeacherSchema,
} from "./formValidationSchemas";
import prisma from "./prisma";
import { clerkClient } from "@clerk/nextjs/server";

type CurrentState = { success: boolean; error: boolean; message?: string };

export const createSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.create({
      data: {
        name: data.name,
        teachers: {
          connect: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        teachers: {
          set: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteSubject = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    // Check if subject has related data
    const subject = await prisma.subject.findUnique({
      where: { id: parseInt(id) },
      include: {
        teachers: true,
        lessons: true,
      },
    });

    if (subject) {
      const issues = [];
      if (subject.teachers.length > 0) {
        issues.push(`${subject.teachers.length} teacher(s)`);
      }
      if (subject.lessons.length > 0) {
        issues.push(`${subject.lessons.length} lesson(s)`);
      }

      if (issues.length > 0) {
        return { 
          success: false, 
          error: true, 
          message: `Cannot delete subject. This subject has ${issues.join(", ")} associated. Please remove them first.` 
        };
      }
    }

    await prisma.subject.delete({
      where: {
        id: parseInt(id),
      },
    });

    revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    return { 
      success: false, 
      error: true, 
      message: err.message || "Failed to delete subject. Please check if it has associated data." 
    };
  }
};

export const createClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    await prisma.class.create({
      data,
    });

    revalidatePath("/list/classes");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    await prisma.class.update({
      where: {
        id: data.id,
      },
      data,
    });

    revalidatePath("/list/classes");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteClass = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    // Check if class has related data
    const classItem = await prisma.class.findUnique({
      where: { id: parseInt(id) },
      include: {
        students: true,
        lessons: true,
        events: true,
        announcements: true,
      },
    });

    if (classItem) {
      const issues = [];
      if (classItem.students.length > 0) {
        issues.push(`${classItem.students.length} student(s)`);
      }
      if (classItem.lessons.length > 0) {
        issues.push(`${classItem.lessons.length} lesson(s)`);
      }
      if (classItem.events.length > 0) {
        issues.push(`${classItem.events.length} event(s)`);
      }
      if (classItem.announcements.length > 0) {
        issues.push(`${classItem.announcements.length} announcement(s)`);
      }

      if (issues.length > 0) {
        return { 
          success: false, 
          error: true, 
          message: `Cannot delete class. This class has ${issues.join(", ")} associated. Please remove them first.` 
        };
      }
    }

    await prisma.class.delete({
      where: {
        id: parseInt(id),
      },
    });

    revalidatePath("/list/classes");
    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    return { 
      success: false, 
      error: true, 
      message: err.message || "Failed to delete class. Please check if it has associated data." 
    };
  }
};

export const createTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  try {
    const user = await clerkClient.users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata:{role:"teacher"}
    });

    await prisma.teacher.create({
      data: {
        id: user.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        subjects: {
          connect: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });

    revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const user = await clerkClient.users.updateUser(data.id, {
      username: data.username,
      ...(data.password !== "" && { password: data.password }),
      firstName: data.name,
      lastName: data.surname,
    });

    await prisma.teacher.update({
      where: {
        id: data.id,
      },
      data: {
        ...(data.password !== "" && { password: data.password }),
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        subjects: {
          set: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });
    revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteTeacher = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    // Check if teacher has related data
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        subjects: true,
        lessons: true,
        classes: true,
      },
    });

    if (teacher) {
      const issues = [];
      if (teacher.subjects.length > 0) {
        issues.push(`${teacher.subjects.length} subject(s)`);
      }
      if (teacher.lessons.length > 0) {
        issues.push(`${teacher.lessons.length} lesson(s)`);
      }
      if (teacher.classes.length > 0) {
        issues.push(`${teacher.classes.length} class(es) as supervisor`);
      }

      if (issues.length > 0) {
        return { 
          success: false, 
          error: true, 
          message: `Cannot delete teacher. This teacher has ${issues.join(", ")} associated. Please remove or reassign them first.` 
        };
      }
    }

    // Try to delete from Clerk, but don't fail if user doesn't exist
    try {
      await clerkClient.users.deleteUser(id);
    } catch (clerkErr: any) {
      // If Clerk user doesn't exist (e.g., seed data), continue with database deletion
      console.log("Clerk user deletion skipped:", clerkErr.message);
    }

    await prisma.teacher.delete({
      where: {
        id: id,
      },
    });

    revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    return { 
      success: false, 
      error: true, 
      message: err.message || "Failed to delete teacher. Please check if it has associated data." 
    };
  }
};

export const createStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  console.log(data);
  try {
    const classItem = await prisma.class.findUnique({
      where: { id: data.classId },
      include: { _count: { select: { students: true } } },
    });

    if (classItem && classItem.capacity === classItem._count.students) {
      return { success: false, error: true };
    }

    const user = await clerkClient.users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata:{role:"student"}
    });

    await prisma.student.create({
      data: {
        id: user.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        gradeId: data.gradeId,
        classId: data.classId,
      },
    });

    revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const user = await clerkClient.users.updateUser(data.id, {
      username: data.username,
      ...(data.password !== "" && { password: data.password }),
      firstName: data.name,
      lastName: data.surname,
    });

    await prisma.student.update({
      where: {
        id: data.id,
      },
      data: {
        ...(data.password !== "" && { password: data.password }),
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        gradeId: data.gradeId,
        classId: data.classId,
      },
    });
    revalidatePath("/list/students");
    revalidatePath(`/list/students/${data.id}`);
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteStudent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    // Try to delete from Clerk, but don't fail if user doesn't exist
    try {
      await clerkClient.users.deleteUser(id);
    } catch (clerkErr: any) {
      // If Clerk user doesn't exist (e.g., seed data), continue with database deletion
      console.log("Clerk user deletion skipped:", clerkErr.message);
    }

    await prisma.student.delete({
      where: {
        id: id,
      },
    });

    revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    return { 
      success: false, 
      error: true, 
      message: err.message || "Failed to delete student. Please check if it has associated data." 
    };
  }
};

export const createExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  // const { userId, sessionClaims } = auth();
  // const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    // if (role === "teacher") {
    //   const teacherLesson = await prisma.lesson.findFirst({
    //     where: {
    //       teacherId: userId!,
    //       id: data.lessonId,
    //     },
    //   });

    //   if (!teacherLesson) {
    //     return { success: false, error: true };
    //   }
    // }

    await prisma.exam.create({
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        lessonId: data.lessonId,
      },
    });

    revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  // const { userId, sessionClaims } = auth();
  // const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    // if (role === "teacher") {
    //   const teacherLesson = await prisma.lesson.findFirst({
    //     where: {
    //       teacherId: userId!,
    //       id: data.lessonId,
    //     },
    //   });

    //   if (!teacherLesson) {
    //     return { success: false, error: true };
    //   }
    // }

    await prisma.exam.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        lessonId: data.lessonId,
      },
    });

    revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteExam = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  // const { userId, sessionClaims } = auth();
  // const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    // Check if exam has related data
    const exam = await prisma.exam.findUnique({
      where: { id: parseInt(id) },
      include: {
        results: true,
      },
    });

    if (exam && exam.results.length > 0) {
      return { 
        success: false, 
        error: true, 
        message: `Cannot delete exam. This exam has ${exam.results.length} result(s) associated. Please remove them first.` 
      };
    }

    await prisma.exam.delete({
      where: {
        id: parseInt(id),
        // ...(role === "teacher" ? { lesson: { teacherId: userId! } } : {}),
      },
    });

    revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    return { 
      success: false, 
      error: true, 
      message: err.message || "Failed to delete exam. Please check if it has associated data." 
    };
  }
};
