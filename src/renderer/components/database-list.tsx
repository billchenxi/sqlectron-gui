import React, { FC, RefObject } from 'react';
import DatabaseListItem from './database-list-item';
import { Database } from '../reducers/databases';
import { DbTable } from '../../common/types/database';
import type { ActionType, ObjectType } from '../reducers/sqlscripts';

interface Props {
  client: string;
  databases: Database[];
  databaseRefs: Record<string, RefObject<HTMLDivElement>>;
  currentDB: string | null;
  isFetching: boolean;
  onSelectDatabase: (database: Database) => void;
  onExecuteDefaultQuery: (database: Database, table: DbTable) => void;
  onSelectTable: (database: Database, table: DbTable) => void;
  onGetSQLScript: (
    database: Database,
    item: { name: string; schema?: string },
    actionType: ActionType,
    objectType: ObjectType,
  ) => void;
  onRefreshDatabase: (database: Database) => void;
  onOpenTab: (database: Database) => void;
  onShowDiagramModal: (database: Database) => void;
}

const DatabaseList: FC<Props> = ({
  client,
  databases,
  databaseRefs,
  currentDB,
  isFetching,
  onSelectDatabase,
  onExecuteDefaultQuery,
  onSelectTable,
  onGetSQLScript,
  onRefreshDatabase,
  onOpenTab,
  onShowDiagramModal,
}) => {
  if (isFetching) {
    return <div className="ui grey item">Loading...</div>;
  }

  if (!databases.length) {
    return <div className="ui grey item">No results found</div>;
  }

  return (
    <div className="item" style={{ padding: 0 }}>
      {databases.map((database) => (
        <DatabaseListItem
          databaseRef={databaseRefs[database.name]}
          key={database.name}
          currentDB={currentDB}
          client={client}
          database={database}
          onExecuteDefaultQuery={onExecuteDefaultQuery}
          onSelectTable={onSelectTable}
          onSelectDatabase={onSelectDatabase}
          onGetSQLScript={onGetSQLScript}
          onRefreshDatabase={onRefreshDatabase}
          onOpenTab={onOpenTab}
          onShowDiagramModal={onShowDiagramModal}
        />
      ))}
    </div>
  );
};

DatabaseList.displayName = 'DatabaseList';
export default DatabaseList;
