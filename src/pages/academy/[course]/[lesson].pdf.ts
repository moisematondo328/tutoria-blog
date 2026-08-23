import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { buildLessonPdf } from '../../../lib/lesson-pdf';

const slugOf = (id: string) => id.split('/').pop() as string;
const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export async function getStaticPaths() {
  const allCourses = await getCollection('courses', ({ data }) => !data.draft);
  const allLessons = await getCollection('lessons', ({ data }) => !data.draft);
  const lessonsOf = (cid: string) =>
    allLessons.filter((l) => l.data.course === cid).sort((a, b) => (a.data.order || 0) - (b.data.order || 0));

  const paths: any[] = [];
  for (const course of allCourses) {
    const lessons = lessonsOf(course.id);
    lessons.forEach((lesson, index) => {
      paths.push({
        params: { course: course.id, lesson: slugOf(lesson.id) },
        props: { course, lesson, index, total: lessons.length },
      });
    });
  }
  return paths;
}

export const GET: APIRoute = async ({ props }) => {
  const { course, lesson, index, total } = props as any;
  const pdf = await buildLessonPdf({
    lessonTitle: lesson.data.title,
    courseTitle: course.data.title,
    category: course.data.category,
    expert: course.data.expert || '',
    markdown: lesson.body || '',
    quiz: lesson.data.quiz || [],
    order: (index ?? 0) + 1,
    total,
  });
  const filename = `Tutoria-${slugify(lesson.data.title)}.pdf`;
  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
