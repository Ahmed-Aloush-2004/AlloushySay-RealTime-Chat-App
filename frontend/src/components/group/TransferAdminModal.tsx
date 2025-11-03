// components/TransferAdminModal.tsx
import React from 'react';
import type { User } from '../../common/interfaces/user';

interface TransferAdminModalProps {
  currentGroup: any;
  user: User | null;
  onTransferAdmin: (newAdminId: string) => void;
}

export const TransferAdminModal: React.FC<TransferAdminModalProps> = ({
  currentGroup,
  user,
  onTransferAdmin
}) => {
  return (
    <div>
      <input type="checkbox" id="transfer-admin-modal" className="modal-toggle" />
      <div className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Transfer Admin Rights</h3>
          <p className="py-4">Select a member to transfer admin rights to:</p>
          <div className="max-h-60 overflow-y-auto">
            {currentGroup.members
              .filter((member: any) => member._id !== user?._id)
              .map((member: any) => (
                <div
                  key={member._id}
                  className="flex items-center gap-3 p-2 hover:bg-base-200 rounded cursor-pointer"
                  onClick={() => {
                    onTransferAdmin(member._id);
                    document.getElementById('transfer-admin-modal')?.click();
                  }}
                >
                  <div className="avatar placeholder">
                    <div className="bg-neutral text-neutral-content rounded-full w-8 h-8">
                      <span className="text-xs">{member.username?.charAt(0).toUpperCase()}</span>
                    </div>
                  </div>
                  <span>{member.username}</span>
                </div>
              ))}
          </div>
          <div className="modal-action">
            <label htmlFor="transfer-admin-modal" className="btn">
              Cancel
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};