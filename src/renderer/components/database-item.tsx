import React, {
  CSSProperties,
  FC,
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { DB_CLIENTS } from '../api';
import CollapseIcon from './collapse-icon';
import TableSubmenu from './table-submenu';
import * as eventKeys from '../../common/event';
import ContextMenu from '../utils/context-menu';
import type { Database } from '../reducers/databases';
import type { ActionType, ObjectType } from '../reducers/sqlscripts';
import type { ColumnsByTable } from '../reducers/columns';
import type { TriggersByTable } from '../reducers/triggers';
import type { IndexesByTable } from '../reducers/indexes';
import type { DbTable } from '../../common/types/database';

const MENU_CTX_ID = 'CONTEXT_MENU_DATABASE_LIST';

interface Props {
  client: string;
  database: Database;
  item: { schema?: string; name: string };
  dbObjectType: ObjectType;
  style?: CSSProperties;
  columnsByTable?: ColumnsByTable;
  triggersByTable?: TriggersByTable;
  indexesByTable?: IndexesByTable;
  onExecuteDefaultQuery?: (database: Database, table: DbTable) => void;
  onSelectItem?: (database: Database, item: DbTable) => void;
  onGetSQLScript: (
    database: Database,
    item: { name: string; schema?: string },
    actionType: ActionType,
    objectType: ObjectType,
  ) => void;
}

const DatabaseItem: FC<Props> = ({
  client,
  database,
  item,
  dbObjectType,
  style,
  columnsByTable,
  triggersByTable,
  indexesByTable,
  onExecuteDefaultQuery,
  onSelectItem,
  onGetSQLScript,
}) => {
  const [tableCollapsed, setTableCollapsed] = useState(true);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [
    displayContextMenuEvent,
    setDisplayContextMenuEvent,
  ] = useState<MouseEvent<HTMLSpanElement> | null>(null);

  const disabledFeatures = useMemo<string[]>(
    () => DB_CLIENTS.find((dbClient) => dbClient.key === client)?.disabledFeatures || [],
    [client],
  );

  useEffect(() => {
    return () => {
      contextMenu?.dispose();
    };
  }, [contextMenu]);

  useEffect(() => {
    if (contextMenu && displayContextMenuEvent) {
      contextMenu.popup({
        x: displayContextMenuEvent.clientX,
        y: displayContextMenuEvent.clientY,
      });
    }
  }, [contextMenu, displayContextMenuEvent]);

  const onSingleClick = useCallback(() => {
    onExecuteDefaultQuery?.(database, item);
  }, [database, item, onExecuteDefaultQuery]);

  const buildContextMenu = useCallback(() => {
    // Create unique context menu for this table
    const newContextMenu = new ContextMenu(`${MENU_CTX_ID}@${database.name}@${item.name}`);

    if ((dbObjectType === 'Table' || dbObjectType === 'View') && onExecuteDefaultQuery) {
      newContextMenu.append({
        label: 'Select Rows (with limit)',
        event: eventKeys.BROWSER_MENU_EXECUTE_DEFAULT_QUERY,
        click: () => onExecuteDefaultQuery(database, item),
      });
    }

    newContextMenu.append({
      type: 'separator',
    });

    if (!disabledFeatures || !disabledFeatures.includes('scriptCreateTable')) {
      newContextMenu.append({
        label: 'Create Statement',
        event: eventKeys.BROWSER_MENU_GET_SQL_SCRIPT_CREATE_TABLE,
        click: () => onGetSQLScript(database, item, 'CREATE', dbObjectType),
      });
    }

    if (dbObjectType === 'Table') {
      newContextMenu.append({
        label: 'Select Statement',
        event: eventKeys.BROWSER_MENU_GET_SQL_SCRIPT_SELECT,
        click: () => onGetSQLScript(database, item, 'SELECT', dbObjectType),
      });

      newContextMenu.append({
        label: 'Insert Statement',
        event: eventKeys.BROWSER_MENU_GET_SQL_SCRIPT_INSERT,
        click: () => onGetSQLScript(database, item, 'INSERT', dbObjectType),
      });

      newContextMenu.append({
        label: 'Update Statement',
        event: eventKeys.BROWSER_MENU_GET_SQL_SCRIPT_UPDATE,
        click: () => onGetSQLScript(database, item, 'UPDATE', dbObjectType),
      });

      newContextMenu.append({
        label: 'Delete Statement',
        event: eventKeys.BROWSER_MENU_GET_SQL_SCRIPT_DELETE,
        click: () => onGetSQLScript(database, item, 'DELETE', dbObjectType),
      });
    }

    newContextMenu.build();
    setContextMenu(newContextMenu);
  }, [database, dbObjectType, disabledFeatures, item, onExecuteDefaultQuery, onGetSQLScript]);

  // Context menu is built dynamically on click (if it does not exist), because building
  // menu onComponentDidMount or onComponentWillMount slows table listing when database
  // has a loads of tables, because menu will be created (unnecessarily) for every table shown
  const onContextMenu = useCallback(
    (event: MouseEvent<HTMLSpanElement>) => {
      event.preventDefault();
      event.persist();

      if (!contextMenu) {
        buildContextMenu();
      }

      setDisplayContextMenuEvent(event);
    },
    [buildContextMenu, contextMenu],
  );

  const toggleTableCollapse = useCallback(() => {
    setTableCollapsed((prev) => !prev);
  }, []);

  const expandChildren = onSelectItem
    ? () => {
        onSelectItem(database, item);
        toggleTableCollapse();
      }
    : () => {
        /* pass */
      };

  const tableIcon = <i className="table icon" style={{ float: 'left', margin: '0 0.3em 0 0' }} />;

  const { schema, name } = item;
  const fullName = schema ? `${schema}.${name}` : name;

  return (
    <div>
      <span style={style} className={`item item-${dbObjectType}`} onContextMenu={onContextMenu}>
        {dbObjectType === 'Table' ? (
          <CollapseIcon
            arrowDirection={tableCollapsed ? 'right' : 'down'}
            expandAction={expandChildren}
          />
        ) : null}
        {dbObjectType === 'Table' ? tableIcon : null}
        <span onClick={onSingleClick}>{fullName}</span>
      </span>
      {columnsByTable?.[name] ? (
        <div style={{ ...(tableCollapsed && { display: 'none' }) }}>
          <TableSubmenu title="Columns" table={name} itemsByTable={columnsByTable} />
          <TableSubmenu
            startCollapsed
            title="Triggers"
            table={name}
            itemsByTable={triggersByTable}
          />
          <TableSubmenu startCollapsed title="Indexes" table={name} itemsByTable={indexesByTable} />
        </div>
      ) : null}
    </div>
  );
};

DatabaseItem.displayName = 'DatabaseItem';
export default DatabaseItem;
