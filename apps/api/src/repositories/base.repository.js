/**
 * Thin repository helpers shared across commerce repositories.
 */

export function withSession(session) {
  return session ? { session } : {};
}

export async function findByIdOrNull(Model, id, { session = null, lean = true, populate = null } = {}) {
  let query = Model.findById(id);
  if (populate) query = query.populate(populate);
  if (session) query = query.session(session);
  if (lean) query = query.lean();
  return query;
}

export async function saveDoc(doc, session = null) {
  if (session) {
    await doc.save({ session });
  } else {
    await doc.save();
  }
  return doc;
}

export default {
  withSession,
  findByIdOrNull,
  saveDoc,
};
