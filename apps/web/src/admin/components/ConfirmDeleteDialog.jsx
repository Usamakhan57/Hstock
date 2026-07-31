import React from 'react';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
} from '../../components/ui/alert-dialog';

const ConfirmDeleteDialog = ({ open, onOpenChange, title, description, onConfirm, busy, confirmLabel, busyLabel }) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title || 'Are you sure?'}</AlertDialogTitle>
        <AlertDialogDescription>
          {description || 'This action cannot be undone.'}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          disabled={busy}
          className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
        >
          {busy ? (busyLabel || 'Deleting…') : (confirmLabel || 'Delete')}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default ConfirmDeleteDialog;
