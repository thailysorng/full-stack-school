"use server";

import { revalidatePath } from "next/cache";
import {
  ClassSchema,
  ExamSchema,
  LessonSchema,
  StudentSchema,
  SubjectSchema,
  TeacherSchema,
} from "./formValidationSchemas";
import prisma from "./prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

type CurrentState = { success: boolean; error: boolean };

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

    // revalidatePath("/list/subjects");
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

    // revalidatePath("/list/subjects");
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
    await prisma.subject.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
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

    // revalidatePath("/list/class");
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

    // revalidatePath("/list/class");
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
    await prisma.class.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
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

    // revalidatePath("/list/teachers");
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
    // revalidatePath("/list/teachers");
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
    await clerkClient.users.deleteUser(id);

    await prisma.teacher.delete({
      where: {
        id: id,
      },
    });

    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
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

    // revalidatePath("/list/students");
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
    // revalidatePath("/list/students");
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
    await clerkClient.users.deleteUser(id);

    await prisma.student.delete({
      where: {
        id: id,
      },
    });

    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  try {
    const { userId, sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    // If caller is teacher, ensure the lesson belongs to them
    if (role === "teacher" && userId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: data.lessonId },
        select: { teacherId: true },
      });

      if (!lesson || lesson.teacherId !== userId) {
        console.log("Teacher cannot create exam for a lesson they don't own");
        return { success: false, error: true };
      }
    }

    await prisma.exam.create({
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        lesson: { connect: { id: data.lessonId } },
      },
    });

    // revalidatePath("/list/exams");
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
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const { userId, sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    // If caller is teacher, ensure the lesson belongs to them
    if (role === "teacher" && userId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: data.lessonId },
        select: { teacherId: true },
      });
      if (!lesson || lesson.teacherId !== userId) {
        console.log("Teacher cannot update exam for a lesson they don't own");
        return { success: false, error: true };
      }

      // Also ensure the existing exam being updated belongs to a lesson that teacher owns
      const existingExam = await prisma.exam.findUnique({
        where: { id: data.id },
        select: { lesson: { select: { teacherId: true } } },
      });
      if (!existingExam || existingExam.lesson.teacherId !== userId) {
        console.log("Teacher cannot update an exam they don't own");
        return { success: false, error: true };
      }
    }

    await prisma.exam.update({
      where: { id: data.id },
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        lesson: { connect: { id: data.lessonId } },
      },
    });

    // revalidatePath("/list/exams");
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
  try {
    const { userId, sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    // If teacher, ensure the exam belongs to one of their lessons
    if (role === "teacher" && userId) {
      const existingExam = await prisma.exam.findUnique({
        where: { id: parseInt(id) },
        select: { lesson: { select: { teacherId: true } } },
      });
      if (!existingExam || existingExam.lesson.teacherId !== userId) {
        console.log("Teacher cannot delete an exam they don't own");
        return { success: false, error: true };
      }
    }

    await prisma.exam.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};
// action.ts (add near other create/update/delete functions)
// second change
export const createLesson = async (
  currentState: CurrentState,
  data: LessonSchema
) => {
  try {
    const { userId, sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    // If caller is teacher, enforce teacherId === current user
    if (role === "teacher" && userId) {
      if (data.teacherId !== userId) {
        console.log("Teacher cannot create lesson for another teacher");
        return { success: false, error: true };
      }

      // Ensure the subject belongs to the teacher (Subject.teachers some.id = userId)
      const subject = await prisma.subject.findUnique({
        where: { id: data.subjectId },
        include: { teachers: { select: { id: true } } },
      });

      if (!subject || !subject.teachers.some((t) => t.id === userId)) {
        console.log("Teacher does not teach this subject");
        return { success: false, error: true };
      }

      // Ensure the class is allowed: either supervised by teacher or teacher already has lessons in that class
      const classItem = await prisma.class.findUnique({
        where: { id: data.classId },
        include: {
          lessons: {
            where: { teacherId: userId },
            select: { id: true },
            take: 1,
          },
        },
      });

      const isSupervisor = classItem?.supervisorId === userId;
      const hasLesson = (classItem?.lessons?.length ?? 0) > 0;

      if (!isSupervisor && !hasLesson) {
        console.log("Teacher not allowed to create lesson for this class");
        return { success: false, error: true };
      }
    }

    await prisma.lesson.create({
      data: {
        name: data.name,
        day: data.day,
        startTime: data.startTime,
        endTime: data.endTime,
        subject: { connect: { id: data.subjectId } },
        class: { connect: { id: data.classId } },
        teacher: { connect: { id: data.teacherId } },
      },
    });

    // revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateLesson = async (
  currentState: CurrentState,
  data: LessonSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }

  try {
    const { userId, sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    // If caller is teacher, enforce teacherId === current user
    if (role === "teacher" && userId) {
      if (data.teacherId !== userId) {
        console.log("Teacher cannot update lesson for another teacher");
        return { success: false, error: true };
      }

      // Ensure the subject belongs to the teacher
      const subject = await prisma.subject.findUnique({
        where: { id: data.subjectId },
        include: { teachers: { select: { id: true } } },
      });

      if (!subject || !subject.teachers.some((t) => t.id === userId)) {
        console.log("Teacher does not teach this subject");
        return { success: false, error: true };
      }

      // Ensure the class is allowed: supervised OR teacher already has lessons
      const classItem = await prisma.class.findUnique({
        where: { id: data.classId },
        include: {
          lessons: { where: { teacherId: userId }, select: { id: true }, take: 1 },
        },
      });

      const isSupervisor = classItem?.supervisorId === userId;
      const hasLesson = (classItem?.lessons?.length ?? 0) > 0;

      if (!isSupervisor && !hasLesson) {
        console.log("Teacher not allowed to set this class for lesson");
        return { success: false, error: true };
      }
    }

    await prisma.lesson.update({
      where: { id: data.id },
      data: {
        name: data.name,
        day: data.day,
        startTime: data.startTime,
        endTime: data.endTime,
        subject: { connect: { id: data.subjectId } },
        class: { connect: { id: data.classId } },
        teacher: { connect: { id: data.teacherId } },
      },
    });

    // revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteLesson = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.lesson.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

// actions.ts (add near other exam functions)

import { AssignmentSchema } from "./formValidationSchemas"; // add this import at top with others if not present

export const createAssignment = async (
  currentState: CurrentState,
  data: AssignmentSchema
) => {
  try {
    const { userId, sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    // If caller is teacher, ensure the lesson belongs to them
    if (role === "teacher" && userId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: data.lessonId },
        select: { teacherId: true },
      });

      if (!lesson || lesson.teacherId !== userId) {
        console.log("Teacher cannot create assignment for a lesson they don't own");
        return { success: false, error: true };
      }
    }

    await prisma.assignment.create({
      data: {
        title: data.title,
        startDate: data.startDate,
        dueDate: data.dueDate,
        lesson: { connect: { id: data.lessonId } },
      },
    });

    // revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateAssignment = async (
  currentState: CurrentState,
  data: AssignmentSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const { userId, sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    // If caller is teacher, ensure the lesson belongs to them and the existing assignment belongs to their lesson
    if (role === "teacher" && userId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: data.lessonId },
        select: { teacherId: true },
      });
      if (!lesson || lesson.teacherId !== userId) {
        console.log("Teacher cannot set lesson to one they don't own");
        return { success: false, error: true };
      }

      const existingAssignment = await prisma.assignment.findUnique({
        where: { id: data.id },
        select: { lesson: { select: { teacherId: true } } },
      });
      if (!existingAssignment || existingAssignment.lesson.teacherId !== userId) {
        console.log("Teacher cannot update an assignment they don't own");
        return { success: false, error: true };
      }
    }

    await prisma.assignment.update({
      where: { id: data.id },
      data: {
        title: data.title,
        startDate: data.startDate,
        dueDate: data.dueDate,
        lesson: { connect: { id: data.lessonId } },
      },
    });

    // revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteAssignment = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const { userId, sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    // If teacher, ensure the assignment belongs to one of their lessons
    if (role === "teacher" && userId) {
      const existingAssignment = await prisma.assignment.findUnique({
        where: { id: parseInt(id) },
        select: { lesson: { select: { teacherId: true } } },
      });
      if (!existingAssignment || existingAssignment.lesson.teacherId !== userId) {
        console.log("Teacher cannot delete an assignment they don't own");
        return { success: false, error: true };
      }
    }

    await prisma.assignment.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};
